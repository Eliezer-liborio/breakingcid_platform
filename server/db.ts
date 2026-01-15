import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, scans, InsertScan, Scan, vulnerabilities, InsertVulnerability, Vulnerability, reports, InsertReport, Report, scanLogs, InsertScanLog, ScanLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ SCANS ============

export async function createScan(scan: InsertScan): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(scans).values(scan);
  return Number(result[0].insertId);
}

export async function getScanById(id: number): Promise<Scan | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(scans).where(eq(scans.id, id)).limit(1);
  return result[0];
}

export async function getScansByUserId(userId: number): Promise<Scan[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(scans).where(eq(scans.userId, userId)).orderBy(desc(scans.createdAt));
}

export async function getAllScans(): Promise<Scan[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(scans).orderBy(desc(scans.createdAt));
}

export async function updateScanStatus(
  id: number,
  status: "pending" | "running" | "completed" | "failed",
  completedAt?: Date,
  duration?: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(scans).set({ status, completedAt, duration }).where(eq(scans.id, id));
}

// ============ VULNERABILITIES ============

export async function createVulnerability(vuln: InsertVulnerability): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vulnerabilities).values(vuln);
  return Number(result[0].insertId);
}

export async function getVulnerabilitiesByScanId(scanId: number): Promise<Vulnerability[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(vulnerabilities).where(eq(vulnerabilities.scanId, scanId));
}

// ============ REPORTS ============

export async function createReport(report: InsertReport): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reports).values(report);
  return Number(result[0].insertId);
}

export async function getReportByScanId(scanId: number): Promise<Report | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(reports).where(eq(reports.scanId, scanId)).limit(1);
  return result[0];
}

// ============ SCAN LOGS ============

export async function createScanLog(log: InsertScanLog): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(scanLogs).values(log);
}

export async function getScanLogsByScanId(scanId: number): Promise<ScanLog[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(scanLogs).where(eq(scanLogs.scanId, scanId)).orderBy(scanLogs.timestamp);
}
