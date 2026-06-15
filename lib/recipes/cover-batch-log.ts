import { appendFile, mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export const COVER_BATCH_DIR = path.join(process.cwd(), ".scrape-cache", "recipe-covers");
export const COVER_BATCH_LOG_PATH = path.join(COVER_BATCH_DIR, "batch.log");
export const COVER_BATCH_STATUS_PATH = path.join(COVER_BATCH_DIR, "batch-status.json");

export type CoverBatchStatus = {
  startedAt: string;
  updatedAt: string;
  status: "running" | "completed" | "failed";
  pid?: number;
  total: number;
  processed: number;
  ok: number;
  fail: number;
  strategy: string;
  current?: string;
  lastOk?: { slug: string; url: string };
  lastError?: { slug: string; message: string };
};

export async function ensureBatchDir() {
  await mkdir(COVER_BATCH_DIR, { recursive: true });
}

export async function appendBatchLog(line: string) {
  await ensureBatchDir();
  const stamp = new Date().toISOString();
  await appendFile(COVER_BATCH_LOG_PATH, `[${stamp}] ${line}\n`, "utf-8");
}

export async function writeBatchStatus(status: CoverBatchStatus) {
  await ensureBatchDir();
  await writeFile(COVER_BATCH_STATUS_PATH, `${JSON.stringify(status, null, 2)}\n`, "utf-8");
}

export async function readBatchStatus(): Promise<CoverBatchStatus | null> {
  try {
    const raw = await readFile(COVER_BATCH_STATUS_PATH, "utf-8");
    return JSON.parse(raw) as CoverBatchStatus;
  } catch {
    return null;
  }
}

export async function tailBatchLog(lines = 15): Promise<string[]> {
  try {
    const raw = await readFile(COVER_BATCH_LOG_PATH, "utf-8");
    return raw.trim().split("\n").slice(-lines);
  } catch {
    return [];
  }
}
