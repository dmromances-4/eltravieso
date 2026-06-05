#!/usr/bin/env tsx
/**
 * Pulir recetas según docs/RECETAS-LIBRO-ESTILO.md
 *
 * Usage:
 *   tsx scripts/polish-recipes.ts [--rules-only] [--ai] [--limit 20] [--slug negroni] [--force] [--dry-run]
 *
 * Por defecto: reglas + IA si hay clave configurada; solo reglas si AI_MOCK=true.
 */
import { copyFile, readFile, writeFile } from "fs/promises";
import path from "path";
import prisma from "../lib/prisma";
import { isTextAiAvailable } from "../lib/ai/availability";
import { JUNK_TITLE_PATTERNS } from "../lib/recipes/style-guide";
import { parseStoredIngredients } from "../lib/recipes/parse";
import { applyRuleBasedPolish, polishRecipe, type PolishableRecipe } from "../lib/recipes/polish-recipe";
import type { CocktailRecord } from "../types/cocktail";

const COCKTAILS_PATH = path.join(process.cwd(), "data/cocktails.json");
const BACKUP_PATH = path.join(process.cwd(), "data/cocktails.json.bak");
const PROGRESS_PATH = path.join(process.cwd(), "data/.recipe-polish-progress.json");

type CliOptions = {
  rulesOnly: boolean;
  useAi: boolean;
  limit?: number;
  slug?: string;
  force: boolean;
  dryRun: boolean;
};

type ProgressFile = { polishedSlugs: string[]; updatedAt: string };

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const opts: CliOptions = { rulesOnly: false, useAi: false, force: false, dryRun: false };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--rules-only") opts.rulesOnly = true;
    else if (arg === "--ai") opts.useAi = true;
    else if (arg === "--force") opts.force = true;
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--limit") opts.limit = Number(args[++i]);
    else if (arg === "--slug") opts.slug = args[++i];
  }

  if (!opts.rulesOnly && !opts.useAi) {
    opts.useAi = isTextAiAvailable() && process.env.AI_MOCK !== "true";
    if (!opts.useAi) opts.rulesOnly = true;
  }

  return opts;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadProgress(): Promise<Set<string>> {
  try {
    const raw = await readFile(PROGRESS_PATH, "utf-8");
    const data = JSON.parse(raw) as ProgressFile;
    return new Set(data.polishedSlugs ?? []);
  } catch {
    return new Set();
  }
}

async function saveProgress(slugs: Set<string>) {
  const payload: ProgressFile = {
    polishedSlugs: [...slugs],
    updatedAt: new Date().toISOString(),
  };
  await writeFile(PROGRESS_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

async function loadStaticRecipes(): Promise<CocktailRecord[]> {
  const raw = await readFile(COCKTAILS_PATH, "utf-8");
  return JSON.parse(raw) as CocktailRecord[];
}

function staticToPolishable(recipe: CocktailRecord): PolishableRecipe {
  return {
    title: recipe.title,
    slug: recipe.slug,
    glass: recipe.glass,
    ingredients: recipe.ingredients,
    method: recipe.method,
    abv: recipe.abv,
    kcal: recipe.kcal,
  };
}

function mergePolishedIntoStatic(original: CocktailRecord, polished: PolishableRecipe): CocktailRecord {
  return {
    ...original,
    title: polished.title,
    glass: polished.glass,
    ingredients: polished.ingredients,
    method: polished.method,
    abv: polished.abv ?? original.abv,
    kcal: polished.kcal ?? original.kcal,
  };
}

async function removeJunkDbRecipes(dryRun: boolean) {
  const rows = await prisma.recipe.findMany({ select: { id: true, title: true, slug: true } });
  const junk = rows.filter((row) => JUNK_TITLE_PATTERNS.some((pattern) => pattern.test(row.title.trim())));
  if (!junk.length) return;

  console.log(`🧹 Recetas basura en BD: ${junk.length}`);
  for (const row of junk) {
    console.log(`  - ${row.title} (${row.slug})`);
    if (!dryRun) {
      await prisma.recipe.delete({ where: { id: row.id } });
    }
  }
}

async function main() {
  const opts = parseArgs();
  await removeJunkDbRecipes(opts.dryRun);
  const progress = await loadProgress();
  const staticRecipes = await loadStaticRecipes();
  const staticMap = new Map(staticRecipes.map((r) => [r.slug, r]));

  const dbRows = await prisma.recipe.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      glass: true,
      ingredients: true,
      method: true,
      summary: true,
    },
    orderBy: { title: "asc" },
  });

  type Job = { source: "static" | "db"; slug: string; input: PolishableRecipe; recipeId?: string; staticIndex?: number };

  const jobs: Job[] = [];

  for (let i = 0; i < staticRecipes.length; i += 1) {
    const recipe = staticRecipes[i];
    if (opts.slug && recipe.slug !== opts.slug) continue;
    if (!opts.force && progress.has(`static:${recipe.slug}`)) continue;
    jobs.push({
      source: "static",
      slug: recipe.slug,
      input: staticToPolishable(recipe),
      staticIndex: i,
    });
  }

  for (const row of dbRows) {
    if (opts.slug && row.slug !== opts.slug) continue;
    if (!opts.force && progress.has(`db:${row.slug}`)) continue;

    const staticFallback = staticMap.get(row.slug);
    const dbIngredients = parseStoredIngredients(row.ingredients);
    const ingredients =
      dbIngredients.length > 0 ? dbIngredients : staticFallback?.ingredients ?? [];

    jobs.push({
      source: "db",
      slug: row.slug,
      recipeId: row.id,
      input: {
        title: row.title,
        slug: row.slug,
        glass: row.glass ?? staticFallback?.glass ?? "Copa de autor",
        ingredients,
        method: row.method ?? staticFallback?.method ?? "",
        summary: row.summary ?? undefined,
      },
    });
  }

  const limited = opts.limit ? jobs.slice(0, opts.limit) : jobs;
  const mode = opts.rulesOnly ? "reglas" : "reglas + IA";

  console.log(`✨ Pulido (${mode}) de ${limited.length} receta(s)…`);

  if (opts.dryRun) {
    for (const job of limited) {
      const preview = applyRuleBasedPolish(job.input);
      console.log(`\n→ ${job.slug} [${job.source}]`);
      console.log(`  título: ${preview.title}`);
      console.log(`  vaso: ${preview.glass}`);
      console.log(`  ingredientes: ${preview.ingredients.length}`);
      console.log(`  método: ${preview.method.split("\n")[0]}…`);
    }
    return;
  }

  try {
    await copyFile(COCKTAILS_PATH, BACKUP_PATH);
    console.log(`📦 Backup: ${BACKUP_PATH}`);
  } catch {
    console.warn("No se pudo crear backup (¿primera ejecución?)");
  }

  let ok = 0;
  let fail = 0;
  let staticChanged = false;

  for (const job of limited) {
    console.log(`\n→ ${job.input.title} (${job.slug})`);
    try {
      const polished = await polishRecipe(job.input, { useAi: !opts.rulesOnly && opts.useAi });

      if (job.source === "static" && job.staticIndex != null) {
        staticRecipes[job.staticIndex] = mergePolishedIntoStatic(staticRecipes[job.staticIndex], polished);
        staticChanged = true;
      }

      if (job.source === "db" && job.recipeId) {
        await prisma.recipe.update({
          where: { id: job.recipeId },
          data: {
            title: polished.title,
            glass: polished.glass,
            ingredients: JSON.stringify(
              polished.ingredients.map((line) => {
                const match = line.match(/^([\d./,\s]+(?:ml|g|gotas?|dash|cda\.?|tsp|oz|cl)?)\s+(.+)$/i);
                if (match) return { amount: match[1].trim(), name: match[2].trim() };
                return { amount: "—", name: line };
              }),
            ),
            method: polished.method,
            summary: polished.summary ?? undefined,
          },
        });
      }

      progress.add(`${job.source}:${job.slug}`);
      await saveProgress(progress);
      console.log(`  ✓ ${polished.title}`);
      ok += 1;

      if (!opts.rulesOnly && opts.useAi) await sleep(1500);
    } catch (error) {
      console.error(`  ✗`, error instanceof Error ? error.message : error);
      fail += 1;
    }
  }

  if (staticChanged) {
    await writeFile(COCKTAILS_PATH, `${JSON.stringify(staticRecipes, null, 2)}\n`, "utf-8");
    console.log("\n📝 Actualizado data/cocktails.json");
  }

  console.log(`\nDone: ${ok} ok, ${fail} failed`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
