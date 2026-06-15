#!/usr/bin/env tsx
/**
 * Batch-generate recipe cover images (100% free): Pexels/Unsplash stock,
 * Difford's reference + Gemini vision/Imagen, or enriched text prompt.
 *
 * Usage:
 *   tsx scripts/generate-recipe-images.ts [--limit 10] [--slug sweet-martini] [--force]
 *   tsx scripts/generate-recipe-images.ts --discover-only --limit 10
 *   tsx scripts/generate-recipe-images.ts --strategy auto|stock|ai
 *   tsx scripts/generate-recipe-images.ts --import-cover ./photo.jpg --slug negroni
 *   tsx scripts/generate-recipe-images.ts --batch --strategy stock --limit 50
 *   tsx scripts/generate-recipe-images.ts --detach --strategy stock --limit 50
 *   tsx scripts/generate-recipe-images.ts --status
 *
 * Background batch writes:
 *   .scrape-cache/recipe-covers/batch.log
 *   .scrape-cache/recipe-covers/batch-status.json
 *
 * Doc: docs/PORTADAS-RECETAS.md
 */
import { config } from "dotenv";
import { spawn } from "child_process";
import { existsSync, openSync } from "fs";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { readFile, writeFile } from "fs/promises";
import path from "path";
import prisma from "../lib/prisma";
import {
  appendBatchLog,
  COVER_BATCH_LOG_PATH,
  COVER_BATCH_STATUS_PATH,
  readBatchStatus,
  tailBatchLog,
  writeBatchStatus,
  type CoverBatchStatus,
} from "../lib/recipes/cover-batch-log";
import { jobTimeoutMs, withTimeout } from "../lib/recipes/fetch-with-timeout";
import {
  importRecipeCoverFromFile,
  resolveRecipeCover,
  type CoverStrategy,
} from "../lib/recipes/generate-recipe-image";
import { shouldRegenerateCover } from "../lib/recipes/cover-utils";
import { parseStoredIngredients } from "../lib/recipes/parse";
import type { RecipeImageInput } from "../lib/recipes/image-prompt";
import type { CocktailRecord } from "../types/cocktail";

const COCKTAILS_PATH = path.join(process.cwd(), "data/cocktails.json");
const SCRIPT_PATH = path.join(process.cwd(), "scripts/generate-recipe-images.ts");

type CliOptions = {
  limit?: number;
  slug?: string;
  force: boolean;
  dryRun: boolean;
  discoverOnly: boolean;
  strategy: CoverStrategy;
  importCover?: string;
  batch: boolean;
  detach: boolean;
  status: boolean;
};

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const opts: CliOptions = {
    force: false,
    dryRun: false,
    discoverOnly: false,
    strategy: "auto",
    batch: false,
    detach: false,
    status: false,
  };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--force") opts.force = true;
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--discover-only") opts.discoverOnly = true;
    else if (arg === "--batch") opts.batch = true;
    else if (arg === "--detach") opts.detach = true;
    else if (arg === "--status") opts.status = true;
    else if (arg === "--limit") opts.limit = Number(args[++i]);
    else if (arg === "--slug") opts.slug = args[++i];
    else if (arg === "--strategy") opts.strategy = args[++i] as CoverStrategy;
    else if (arg === "--import-cover") opts.importCover = args[++i];
  }
  return opts;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function loadStaticRecipes(): Promise<CocktailRecord[]> {
  const raw = await readFile(COCKTAILS_PATH, "utf-8");
  return JSON.parse(raw) as CocktailRecord[];
}

async function saveStaticRecipes(recipes: CocktailRecord[]) {
  await writeFile(COCKTAILS_PATH, `${JSON.stringify(recipes, null, 2)}\n`, "utf-8");
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function effectiveBatchStatus(): Promise<CoverBatchStatus | null> {
  const status = await readBatchStatus();
  if (!status) return null;
  if (status.status === "running" && status.pid && !isProcessAlive(status.pid)) {
    return {
      ...status,
      status: "failed",
      updatedAt: new Date().toISOString(),
      lastError: {
        slug: status.current ?? "batch",
        message: "Proceso terminado inesperadamente (revisa batch.log)",
      },
    };
  }
  return status;
}

async function printBatchStatus() {
  const status = await effectiveBatchStatus();
  if (!status) {
    console.log("No hay batch en curso ni historial reciente.");
    console.log(`Log: ${COVER_BATCH_LOG_PATH}`);
    return;
  }

  const alive = status.pid ? isProcessAlive(status.pid) : false;
  const effectiveStatus =
    status.status === "running" && status.pid && !alive ? "failed" : status.status;

  console.log("Estado del batch de portadas");
  console.log("─".repeat(40));
  console.log(`Estado:     ${effectiveStatus}${status.pid ? ` (PID ${status.pid}${alive ? ", activo" : ", no responde"})` : ""}`);
  console.log(`Estrategia: ${status.strategy}`);
  console.log(`Progreso:   ${status.processed}/${status.total} · ok=${status.ok} fail=${status.fail}`);
  if (status.current) console.log(`Actual:     ${status.current}`);
  if (status.lastOk) console.log(`Último OK:  ${status.lastOk.slug} → ${status.lastOk.url}`);
  if (status.lastError) console.log(`Último err: ${status.lastError.slug} — ${status.lastError.message}`);
  console.log(`Inicio:     ${status.startedAt}`);
  console.log(`Actualizado: ${status.updatedAt}`);
  console.log(`Log:        ${COVER_BATCH_LOG_PATH}`);
  console.log(`JSON:       ${COVER_BATCH_STATUS_PATH}`);

  const tail = await tailBatchLog(12);
  if (tail.length) {
    console.log("\nÚltimas líneas del log:");
    for (const line of tail) console.log(line);
  }
}

function spawnDetachedBatch(forwardArgs: string[]) {
  const args = forwardArgs.filter((a) => a !== "--detach");
  if (!args.includes("--batch")) args.push("--batch");

  const tsxCli = path.join(process.cwd(), "node_modules/tsx/dist/cli.mjs");
  if (!existsSync(tsxCli)) {
    console.error("tsx no encontrado. Ejecuta npm install.");
    process.exit(1);
  }

  const logFd = openSync(COVER_BATCH_LOG_PATH, "a");
  const child = spawn(process.execPath, [tsxCli, SCRIPT_PATH, ...args], {
      detached: true,
      stdio: ["ignore", logFd, logFd],
      cwd: process.cwd(),
      env: process.env,
    },
  );

  child.unref();

  const now = new Date().toISOString();
  const status: CoverBatchStatus = {
    startedAt: now,
    updatedAt: now,
    status: "running",
    total: 0,
    processed: 0,
    ok: 0,
    fail: 0,
    strategy: args.includes("--strategy")
      ? (args[args.indexOf("--strategy") + 1] ?? "auto")
      : "auto",
  };

  void writeBatchStatus(status);

  console.log("Batch en segundo plano (ver PID en batch-status.json tras arrancar)");
  console.log(`Log:    ${COVER_BATCH_LOG_PATH}`);
  console.log(`Estado: npm run generate:recipe-images:status`);
}

type Job = RecipeImageInput & {
  slug: string;
  source: "db" | "static";
  recipeId?: string;
  existingCover?: string | null;
};

async function buildJobs(opts: CliOptions, staticRecipes: CocktailRecord[]): Promise<Job[]> {
  const dbRecipes = await prisma.recipe.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      glass: true,
      ingredients: true,
      method: true,
      imageUrl: true,
    },
    orderBy: { title: "asc" },
  });

  const jobs: Job[] = [];
  const staticBySlug = new Map(staticRecipes.map((r) => [r.slug, r]));

  for (const row of dbRecipes) {
    if (opts.slug && row.slug !== opts.slug) continue;
    if (!shouldRegenerateCover(row.imageUrl, opts.force)) continue;
    const staticMatch = staticBySlug.get(row.slug);
    jobs.push({
      slug: row.slug,
      title: row.title,
      glass: row.glass ?? "Copa de autor",
      ingredients: parseStoredIngredients(row.ingredients),
      method: row.method ?? undefined,
      sourceUrl: staticMatch?.sourceUrl,
      source: "db",
      recipeId: row.id,
      existingCover: row.imageUrl,
    });
  }

  const dbSlugs = new Set(dbRecipes.map((r) => r.slug));
  for (const recipe of staticRecipes) {
    if (dbSlugs.has(recipe.slug)) continue;
    if (opts.slug && recipe.slug !== opts.slug) continue;
    if (!shouldRegenerateCover(recipe.cover, opts.force)) continue;
    jobs.push({
      slug: recipe.slug,
      title: recipe.title,
      glass: recipe.glass,
      ingredients: recipe.ingredients,
      method: recipe.method,
      sourceUrl: recipe.sourceUrl,
      source: "static",
      existingCover: recipe.cover,
    });
  }

  return opts.limit ? jobs.slice(0, opts.limit) : jobs;
}

async function updateBatchProgress(partial: Partial<CoverBatchStatus> & Pick<CoverBatchStatus, "total">) {
  const prev = (await readBatchStatus()) ?? {
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "running" as const,
    total: partial.total,
    processed: 0,
    ok: 0,
    fail: 0,
    strategy: partial.strategy ?? "auto",
  };

  const next: CoverBatchStatus = {
    ...prev,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  await writeBatchStatus(next);
}

async function logBatch(line: string, batch: boolean) {
  if (batch) {
    await appendBatchLog(line);
    return;
  }
  console.log(line);
}

async function main() {
  const opts = parseArgs();

  if (opts.status) {
    await printBatchStatus();
    return;
  }

  if (opts.detach) {
    const running = await effectiveBatchStatus();
    if (running?.status === "running" && running.pid && isProcessAlive(running.pid)) {
      console.error(`Ya hay un batch activo (PID ${running.pid}). Usa --status para ver progreso.`);
      process.exit(1);
    }
    spawnDetachedBatch(process.argv.slice(2));
    return;
  }

  if (opts.importCover) {
    if (!opts.slug) {
      console.error("--import-cover requires --slug");
      process.exit(1);
    }
    const staticRecipes = await loadStaticRecipes();
    const staticRecipe = staticRecipes.find((r) => r.slug === opts.slug);
    const title = staticRecipe?.title ?? opts.slug;
    const imageUrl = await importRecipeCoverFromFile(opts.slug, opts.importCover, title);

    if (staticRecipe) {
      const idx = staticRecipes.findIndex((r) => r.slug === opts.slug);
      staticRecipes[idx] = { ...staticRecipes[idx], cover: imageUrl };
      await saveStaticRecipes(staticRecipes);
    }

    const dbRecipe = await prisma.recipe.findFirst({ where: { slug: opts.slug } });
    if (dbRecipe) {
      await prisma.recipe.update({ where: { id: dbRecipe.id }, data: { imageUrl } });
    }

    console.log(`✓ Imported cover for ${opts.slug}: ${imageUrl}`);
    return;
  }

  const batch = opts.batch;
  const staticRecipes = await loadStaticRecipes();
  let staticChanged = false;
  const jobs = await buildJobs(opts, staticRecipes);
  const jobTimeout = jobTimeoutMs();

  if (batch) {
    await updateBatchProgress({
      status: "running",
      pid: process.pid,
      total: jobs.length,
      processed: 0,
      ok: 0,
      fail: 0,
      strategy: opts.strategy,
      startedAt: new Date().toISOString(),
    });
    await appendBatchLog(
      `Batch iniciado · ${jobs.length} recetas · strategy=${opts.strategy} · timeout=${jobTimeout}ms/receta`,
    );
  }

  await logBatch(
    `🍸 Processing ${jobs.length} recipe(s) [strategy=${opts.strategy}, batch=${batch}, timeout=${jobTimeout}ms]…`,
    batch,
  );

  let ok = 0;
  let fail = 0;
  let processed = 0;

  for (const job of jobs) {
    processed += 1;
    if (batch) {
      await updateBatchProgress({
        total: jobs.length,
        processed,
        ok,
        fail,
        strategy: opts.strategy,
        current: job.slug,
      });
    }

    await logBatch(`\n→ ${job.title} (${job.slug}) [${processed}/${jobs.length}]`, batch);

    if (opts.dryRun || opts.discoverOnly) {
      try {
        const result = await withTimeout(
          resolveRecipeCover(job.slug, job, {
            strategy: opts.strategy,
            discoverOnly: true,
          }),
          jobTimeout,
          job.slug,
        );
        for (const candidate of result.candidates?.slice(0, 5) ?? []) {
          await logBatch(
            `  [${candidate.source}] score=${candidate.score?.toFixed(2)} ${candidate.license} — ${candidate.url.slice(0, 80)}…`,
            batch,
          );
        }
        if (opts.dryRun) continue;
        ok += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await logBatch(`  ✗ ${message}`, batch);
        fail += 1;
      }
      continue;
    }

    try {
      const result = await withTimeout(
        resolveRecipeCover(job.slug, job, { strategy: opts.strategy }),
        jobTimeout,
        job.slug,
      );
      const imageUrl = result.imageUrl;

      if (!imageUrl) {
        await logBatch(`  ⚠ Sin imagen (${result.strategy})`, batch);
        continue;
      }

      if (job.source === "db" && job.recipeId) {
        await prisma.recipe.update({
          where: { id: job.recipeId },
          data: { imageUrl },
        });
      }

      const idx = staticRecipes.findIndex((r) => r.slug === job.slug);
      if (idx >= 0) {
        staticRecipes[idx] = {
          ...staticRecipes[idx],
          cover: imageUrl,
          ...(result.attribution ? { coverAttribution: result.attribution } : {}),
        };
        staticChanged = true;
        if (batch) {
          await saveStaticRecipes(staticRecipes);
          await appendBatchLog(`  💾 cocktails.json guardado (${job.slug})`);
        }
      }

      const meta = [result.strategy, result.attribution ? `attribution: ${result.attribution}` : null]
        .filter(Boolean)
        .join(" · ");

      await logBatch(`  ✓ ${imageUrl}`, batch);
      await logBatch(`    ${meta}`, batch);
      ok += 1;

      if (batch) {
        await updateBatchProgress({
          total: jobs.length,
          processed,
          ok,
          fail,
          strategy: opts.strategy,
          lastOk: { slug: job.slug, url: imageUrl },
          lastError: undefined,
        });
      }

      await sleep(1100);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await logBatch(`  ✗ ${message}`, batch);
      fail += 1;
      if (batch) {
        await updateBatchProgress({
          total: jobs.length,
          processed,
          ok,
          fail,
          strategy: opts.strategy,
          lastError: { slug: job.slug, message },
        });
      }
    }
  }

  if (staticChanged && !batch) {
    await saveStaticRecipes(staticRecipes);
    console.log("\n📝 Updated data/cocktails.json covers");
  } else if (staticChanged && batch) {
    await appendBatchLog("📝 cocktails.json actualizado (incremental durante el batch)");
  }

  const summary = `Done: ${ok} ok, ${fail} failed`;
  await logBatch(`\n${summary}`, batch);

  if (batch) {
    await updateBatchProgress({
      status: fail > 0 && ok === 0 ? "failed" : "completed",
      total: jobs.length,
      processed,
      ok,
      fail,
      strategy: opts.strategy,
      current: undefined,
    });
    await appendBatchLog(`Batch finalizado · ${summary}`);
  }
}

main()
  .catch(async (err) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    try {
      const prev = await readBatchStatus();
      if (prev?.status === "running") {
        await writeBatchStatus({
          ...prev,
          status: "failed",
          updatedAt: new Date().toISOString(),
          lastError: { slug: prev.current ?? "batch", message },
        });
        await appendBatchLog(`Batch abortado: ${message}`);
      }
    } catch {
      /* ignore */
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
