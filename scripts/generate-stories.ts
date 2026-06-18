#!/usr/bin/env tsx
/** Fase 5 — Generador de historias (con --detach para batch en background) */
import { config } from "dotenv";
import { spawn } from "child_process";
import { existsSync, openSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";

config({ path: ".env.local" });
config({ path: ".env" });

const SCRIPT_PATH = path.join(process.cwd(), "scripts/generate-stories.ts");
const BATCH_LOG_PATH = path.join(process.cwd(), "data/.story-generation-batch.log");
const BATCH_STATUS_PATH = path.join(process.cwd(), "data/.story-generation-batch-status.json");

type BatchStatus = {
  startedAt: string;
  updatedAt: string;
  status: "running" | "done" | "failed";
  pid?: number;
  limit?: number;
  processed: number;
  created: number;
  failed: number;
  skipped: number;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    limit: undefined as number | undefined,
    slug: undefined as string | undefined,
    category: undefined as string | undefined,
    force: false,
    dryRun: false,
    discoverOnly: false,
    useAi: true,
    targetTotal: undefined as number | undefined,
    detach: false,
    status: false,
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === "--limit") opts.limit = Number(args[++i]);
    else if (a === "--slug") opts.slug = args[++i];
    else if (a === "--category") opts.category = args[++i];
    else if (a === "--force") opts.force = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--discover-only") opts.discoverOnly = true;
    else if (a === "--no-ai") opts.useAi = false;
    else if (a === "--target-total") opts.targetTotal = Number(args[++i]);
    else if (a === "--detach") opts.detach = true;
    else if (a === "--status") opts.status = true;
  }
  return opts;
}

async function printBatchStatus() {
  try {
    const raw = await readFile(BATCH_STATUS_PATH, "utf8");
    const status = JSON.parse(raw) as BatchStatus;
    console.log(JSON.stringify(status, null, 2));
    console.log(`Log: ${BATCH_LOG_PATH}`);
  } catch {
    console.log("No hay batch en curso. Archivo:", BATCH_STATUS_PATH);
  }
}

function spawnDetached(forwardArgs: string[]) {
  const args = forwardArgs.filter((a) => a !== "--detach" && a !== "--status");
  const tsxCli = path.join(process.cwd(), "node_modules/tsx/dist/cli.mjs");
  if (!existsSync(tsxCli)) {
    console.error("tsx no encontrado. Ejecuta npm install.");
    process.exit(1);
  }

  const logFd = openSync(BATCH_LOG_PATH, "a");
  const child = spawn(process.execPath, [tsxCli, SCRIPT_PATH, ...args], {
    detached: true,
    stdio: ["ignore", logFd, logFd],
    cwd: process.cwd(),
    env: process.env,
  });
  child.unref();

  const now = new Date().toISOString();
  const status: BatchStatus = {
    startedAt: now,
    updatedAt: now,
    status: "running",
    pid: child.pid,
    limit: args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : undefined,
    processed: 0,
    created: 0,
    failed: 0,
    skipped: 0,
  };
  void writeFile(BATCH_STATUS_PATH, JSON.stringify(status, null, 2));

  console.log(`Batch historias en background (PID ${child.pid})`);
  console.log(`Log:    ${BATCH_LOG_PATH}`);
  console.log(`Estado: npm run generate:stories -- --status`);
}

async function main() {
  const opts = parseArgs();
  if (opts.status) {
    await printBatchStatus();
    return;
  }
  if (opts.detach) {
    spawnDetached(process.argv.slice(2));
    return;
  }

  const { runGenerateStories } = await import("@/lib/story-universe/generator/run-generate-stories");
  const result = await runGenerateStories(opts);
  console.log(JSON.stringify(result, null, 2));

  try {
    const raw = await readFile(BATCH_STATUS_PATH, "utf8");
    const status = JSON.parse(raw) as BatchStatus;
    if (status.status === "running") {
      status.status = "done";
      status.updatedAt = new Date().toISOString();
      status.created = result.created;
      status.failed = result.failed;
      status.skipped = result.skipped;
      status.processed = result.created + result.failed + result.skipped;
      await writeFile(BATCH_STATUS_PATH, JSON.stringify(status, null, 2));
    }
  } catch {
    // no batch status file
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
