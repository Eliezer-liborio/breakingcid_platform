import { Router } from "express";
import { createScanLog, getAllScans, updateScan } from "./db";
import { createVulnerability } from "./db";
import { createReport } from "./db";
import { ENV } from "./_core/env";

const router = Router();

// Middleware para autenticar worker
const authenticateWorker = (req: any, res: any, next: any) => {
  const apiKey = req.headers["x-worker-api-key"];
  const expectedKey = process.env.WORKER_API_KEY || "default-worker-key-change-in-production";
  
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  next();
};

router.use(authenticateWorker);

/**
 * GET /api/worker/jobs/pending
 * Worker busca jobs pendentes para executar
 */
router.get("/jobs/pending", async (req, res) => {
  try {
    const workerId = req.query.workerId as string;
    
    if (!workerId) {
      return res.status(400).json({ error: "workerId required" });
    }

    // Buscar primeiro scan pendente
    const scans = await getAllScans();
    const pendingScan = scans.find(s => s.status === "pending");
    
    if (!pendingScan) {
      return res.json({ job: null });
    }

    // Marcar como running e atribuir ao worker
    await updateScan(pendingScan.id, {
      status: "running",
      workerId,
      workerPickedAt: new Date(),
    });

    return res.json({
      job: {
        id: pendingScan.id,
        scanType: pendingScan.scanType,
        target: pendingScan.target,
        scope: pendingScan.scope,
      },
    });
  } catch (error: any) {
    console.error("[Worker API] Error fetching pending jobs:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/worker/jobs/:id/logs
 * Worker envia logs em tempo real
 */
router.post("/jobs/:id/logs", async (req, res) => {
  try {
    const scanId = parseInt(req.params.id);
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message required" });
    }

    await createScanLog({
      scanId,
      message,
      timestamp: new Date(),
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error("[Worker API] Error saving log:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/worker/jobs/:id/results
 * Worker envia resultados finais
 */
router.post("/jobs/:id/results", async (req, res) => {
  try {
    const scanId = parseInt(req.params.id);
    const { status, vulnerabilities, report, duration } = req.body;

    // Atualizar scan
    await updateScan(scanId, {
      status: status || "completed",
      completedAt: new Date(),
      duration,
    });

    // Salvar vulnerabilidades
    if (vulnerabilities && Array.isArray(vulnerabilities)) {
      for (const vuln of vulnerabilities) {
        await createVulnerability({
          scanId,
          type: vuln.type,
          severity: vuln.severity,
          title: vuln.title,
          description: vuln.description,
          payload: vuln.payload,
          evidence: vuln.evidence,
          remediation: vuln.remediation,
          cvss: vuln.cvss,
        });
      }
    }

    // Salvar relatório
    if (report) {
      await createReport({
        scanId,
        content: report.content,
        summary: report.summary,
      });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("[Worker API] Error saving results:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/worker/jobs/:id/error
 * Worker reporta erro na execução
 */
router.post("/jobs/:id/error", async (req, res) => {
  try {
    const scanId = parseInt(req.params.id);
    const { error } = req.body;

    await updateScan(scanId, {
      status: "failed",
      completedAt: new Date(),
    });

    await createScanLog({
      scanId,
      message: `[!] ERROR: ${error}`,
      timestamp: new Date(),
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error("[Worker API] Error reporting error:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
