import { PGlite } from "@electric-sql/pglite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { SCHEMA_SQL } from "./schema";
import { seedDatabase } from "./seed";

type GlobalWithDb = typeof globalThis & { __notaraDb?: Promise<PGlite> };
const globalWithDb = globalThis as GlobalWithDb;

async function createDb(): Promise<PGlite> {
  const dir = path.join(process.cwd(), ".data", "notara");
  mkdirSync(dir, { recursive: true });
  const db = new PGlite(dir);
  await db.waitReady;
  await db.exec(SCHEMA_SQL);
  await seedDatabase(db);
  return db;
}

export function getDb(): Promise<PGlite> {
  if (!globalWithDb.__notaraDb) {
    globalWithDb.__notaraDb = createDb();
  }
  return globalWithDb.__notaraDb;
}

export async function q<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const db = await getDb();
  const result = await db.query<T>(sql, params);
  return result.rows;
}

export async function one<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await q<T>(sql, params);
  return rows[0] ?? null;
}

export async function exec(sql: string, params: unknown[] = []): Promise<void> {
  const db = await getDb();
  await db.query(sql, params);
}

export function parseJson<T>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}

export function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return new Date();
}
