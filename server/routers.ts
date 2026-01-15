import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { 
  createScan, 
  getScanById, 
  getScansByUserId, 
  getAllScans,
  updateScanStatus,
  createVulnerability,
  getVulnerabilitiesByScanId,
  createReport,
  getReportByScanId
} from "./db";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  scans: router({
    // Create a new scan
    create: protectedProcedure
      .input(z.object({
        scanType: z.enum(["http_smuggling", "ssrf", "xss", "subdomain_enum", "comprehensive"]),
        target: z.string().url(),
        scope: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const scanId = await createScan({
          userId: ctx.user.id,
          scanType: input.scanType,
          target: input.target,
          scope: input.scope,
          status: "pending",
        });

        // Start scan asynchronously
        executeScanAsync(scanId, input.scanType, input.target).catch(err => {
          console.error(`[Scan ${scanId}] Error:`, err);
        });

        return { scanId, status: "pending" };
      }),

    // Get user's scans
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === 'admin') {
        return await getAllScans();
      }
      return await getScansByUserId(ctx.user.id);
    }),

    // Get scan details
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const scan = await getScanById(input.id);
        
        if (!scan) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Scan not found' });
        }

        // Check permissions
        if (ctx.user.role !== 'admin' && scan.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }

        const vulnerabilities = await getVulnerabilitiesByScanId(input.id);
        const report = await getReportByScanId(input.id);

        return {
          scan,
          vulnerabilities,
          report,
        };
      }),

    // Get scan statistics
    stats: protectedProcedure.query(async ({ ctx }) => {
      const scans = ctx.user.role === 'admin' 
        ? await getAllScans() 
        : await getScansByUserId(ctx.user.id);

      const total = scans.length;
      const completed = scans.filter(s => s.status === 'completed').length;
      const running = scans.filter(s => s.status === 'running').length;
      const failed = scans.filter(s => s.status === 'failed').length;

      // Get all vulnerabilities for completed scans
      const allVulns = await Promise.all(
        scans
          .filter(s => s.status === 'completed')
          .map(s => getVulnerabilitiesByScanId(s.id))
      );

      const vulnerabilities = allVulns.flat();
      const critical = vulnerabilities.filter(v => v.severity === 'critical').length;
      const high = vulnerabilities.filter(v => v.severity === 'high').length;
      const medium = vulnerabilities.filter(v => v.severity === 'medium').length;
      const low = vulnerabilities.filter(v => v.severity === 'low').length;

      return {
        scans: { total, completed, running, failed },
        vulnerabilities: { 
          total: vulnerabilities.length, 
          critical, 
          high, 
          medium, 
          low 
        },
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;

// Async scan execution function with retry logic
async function executeScanAsync(scanId: number, scanType: string, target: string) {
  const startTime = Date.now();
  
  try {
    await updateScanStatus(scanId, "running");

    let result: any;
    const modulesPath = path.join(process.cwd(), 'server', 'modules');

    // Helper function to execute with retry
    const execWithRetry = async (command: string, timeout: number, maxRetries = 3) => {
      let lastError;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[Scan ${scanId}] Attempt ${attempt}/${maxRetries}: ${command}`);
          const { stdout, stderr } = await execAsync(command, { timeout });
          if (stderr) {
            // Log stderr output (includes verbose logs)
            console.log(`[Scan ${scanId}] stderr:`, stderr);
            if (stderr.includes('Error') && !stderr.includes('[VERBOSE]')) {
              console.warn(`[Scan ${scanId}] Warning in stderr:`, stderr);
            }
          }
          return { stdout, stderr };
        } catch (error: any) {
          lastError = error;
          console.error(`[Scan ${scanId}] Attempt ${attempt} failed:`, error.message);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          }
        }
      }
      throw lastError;
    };

    if (scanType === "http_smuggling") {
      const { stdout } = await execWithRetry(`python3.10 ${modulesPath}/http_smuggling.py "${target}"`, 120000);
      result = JSON.parse(stdout);
    } else if (scanType === "ssrf") {
      const { stdout } = await execWithRetry(`python3.10 ${modulesPath}/ssrf_scanner.py "${target}"`, 120000);
      result = JSON.parse(stdout);
    } else if (scanType === "xss") {
      const { stdout } = await execWithRetry(`python3.10 ${modulesPath}/xss_scanner.py "${target}" --verbose`, 120000);
      result = JSON.parse(stdout);
    } else if (scanType === "subdomain_enum") {
      const { stdout } = await execWithRetry(`python3.10 ${modulesPath}/subdomain_enum.py "${target}"`, 180000);
      result = JSON.parse(stdout);
    } else if (scanType === "comprehensive") {
      // Run all scans with retry
      const results = await Promise.all([
        execWithRetry(`python3.10 ${modulesPath}/http_smuggling.py "${target}"`, 120000),
        execWithRetry(`python3.10 ${modulesPath}/ssrf_scanner.py "${target}"`, 120000),
        execWithRetry(`python3.10 ${modulesPath}/xss_scanner.py "${target}" --verbose`, 120000),
        execWithRetry(`python3.10 ${modulesPath}/subdomain_enum.py "${target}"`, 180000),
      ]);
      
      const smugglingResult = JSON.parse(results[0].stdout);
      const ssrfResult = JSON.parse(results[1].stdout);
      const xssResult = JSON.parse(results[2].stdout);
      const subdomainResult = JSON.parse(results[3].stdout);
      
      result = {
        success: true,
        vulnerabilities: [
          ...smugglingResult.vulnerabilities,
          ...ssrfResult.vulnerabilities,
          ...xssResult.vulnerabilities,
          ...subdomainResult.vulnerabilities,
        ],
      };
    }

    if (!result.success) {
      throw new Error(result.error || "Scan failed");
    }

    // Store vulnerabilities
    for (const vuln of result.vulnerabilities) {
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

    // Generate report
    const report = generateMarkdownReport(target, scanType, result.vulnerabilities);
    const summary = {
      total: result.vulnerabilities.length,
      critical: result.vulnerabilities.filter((v: any) => v.severity === 'critical').length,
      high: result.vulnerabilities.filter((v: any) => v.severity === 'high').length,
      medium: result.vulnerabilities.filter((v: any) => v.severity === 'medium').length,
      low: result.vulnerabilities.filter((v: any) => v.severity === 'low').length,
      info: result.vulnerabilities.filter((v: any) => v.severity === 'info').length,
    };

    await createReport({
      scanId,
      content: report,
      summary,
    });

    const duration = Math.floor((Date.now() - startTime) / 1000);
    await updateScanStatus(scanId, "completed", new Date(), duration);

  } catch (error) {
    console.error(`[Scan ${scanId}] Failed:`, error);
    const duration = Math.floor((Date.now() - startTime) / 1000);
    await updateScanStatus(scanId, "failed", new Date(), duration);
  }
}

function generateMarkdownReport(target: string, scanType: string, vulnerabilities: any[]): string {
  const now = new Date().toLocaleString();
  
  let report = `# Security Scan Report\n\n`;
  report += `**Target:** ${target}\n\n`;
  report += `**Scan Type:** ${scanType.replace('_', ' ').toUpperCase()}\n\n`;
  report += `**Date:** ${now}\n\n`;
  report += `---\n\n`;
  
  report += `## Executive Summary\n\n`;
  report += `Total vulnerabilities found: **${vulnerabilities.length}**\n\n`;
  
  const critical = vulnerabilities.filter(v => v.severity === 'critical').length;
  const high = vulnerabilities.filter(v => v.severity === 'high').length;
  const medium = vulnerabilities.filter(v => v.severity === 'medium').length;
  const low = vulnerabilities.filter(v => v.severity === 'low').length;
  
  report += `- 🔴 Critical: ${critical}\n`;
  report += `- 🟠 High: ${high}\n`;
  report += `- 🟡 Medium: ${medium}\n`;
  report += `- 🟢 Low: ${low}\n\n`;
  
  if (vulnerabilities.length === 0) {
    report += `✅ No vulnerabilities detected.\n\n`;
    return report;
  }
  
  report += `---\n\n## Vulnerabilities\n\n`;
  
  vulnerabilities.forEach((vuln, index) => {
    report += `### ${index + 1}. ${vuln.title}\n\n`;
    report += `**Severity:** ${vuln.severity.toUpperCase()}\n\n`;
    report += `**Type:** ${vuln.type}\n\n`;
    report += `**CVSS Score:** ${vuln.cvss || 'N/A'}\n\n`;
    report += `**Description:**\n\n${vuln.description}\n\n`;
    
    if (vuln.payload) {
      report += `**Payload:**\n\n\`\`\`\n${vuln.payload}\n\`\`\`\n\n`;
    }
    
    if (vuln.evidence) {
      report += `**Evidence:**\n\n\`\`\`\n${vuln.evidence}\n\`\`\`\n\n`;
    }
    
    report += `**Remediation:**\n\n${vuln.remediation}\n\n`;
    report += `---\n\n`;
  });
  
  report += `## Methodology\n\n`;
  report += `This security assessment was conducted using industry-standard techniques based on:\n\n`;
  report += `- OWASP Testing Guide v4.2\n`;
  report += `- NIST SP 800-115\n`;
  report += `- PTES (Penetration Testing Execution Standard)\n`;
  report += `- Research by James Kettle (PortSwigger) on HTTP Request Smuggling\n\n`;
  
  return report;
}
