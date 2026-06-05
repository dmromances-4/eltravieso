#!/usr/bin/env tsx
/**
 * Batch-generate recipe cover images via AI (or branded SVG in AI_MOCK mode).
 *
 * Usage:
 *   tsx scripts/generate-recipe-images.ts [--limit 10] [--slug sweet-martini] [--force] [--dry-run]
 */
import { readFile, writeFile } from "fs/promises";
import path from "path";
import prisma from "../lib/prisma";
import { generateAndUploadRecipeCover } from "../lib/recipes/generate-recipe-image";
import { buildRecipeImagePrompt } from "../lib/recipes/image-prompt";
import { parseStoredIngredients } from "../lib/recipes/parse";
import type { CocktailRecord } from "../types/cocktail";

const COCKTAILS_PATH = path.join(process.cwd(), "data/cocktails.json");
const PLACEHOLDER = "/cocktail-placeholder.svg";

type CliOptions = {
  limit?: number;
  slug?: string;
  force: boolean;
  dryRun: boolean;
};

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const opts: CliOptions = { force: false, dryRun: false };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--force") opts.force = true;
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--limit") opts.limit = Number(args[++i]);
    else if (arg === "--slug") opts.slug = args[++i];
  }
  return opts;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRealCover(cover?: string | null) {
  return Boolean(cover && cover !== PLACEHOLDER && !cover.includes("placeholder"));
}

async function loadStaticRecipes(): Promise<CocktailRecord[]> {
  const raw = await readFile(COCKTAILS_PATH, "utf-8");
  return JSON.parse(raw) as CocktailRecord[];
}

async function saveStaticRecipes(recipes: CocktailRecord[]) {
  await writeFile(COCKTAILS_PATH, `${JSON.stringify(recipes, null, 2)}\n`, "utf-8");
}

async function main() {
  const opts = parseArgs();
  const staticRecipes = await loadStaticRecipes();
  let staticChanged = false;

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

  type Job = {
    slug: string;
    title: string;
    glass: string;
    ingredients: string[];
    method?: string;
    source: "db" | "static";
    recipeId?: string;
    existingCover?: string | null;
  };

  const jobs: Job[] = [];

  for (const row of dbRecipes) {
    if (opts.slug && row.slug !== opts.slug) continue;
    if (!opts.force && isRealCover(row.imageUrl)) continue;
    jobs.push({
      slug: row.slug,
      title: row.title,
      glass: row.glass ?? "Copa de autor",
      ingredients: parseStoredIngredients(row.ingredients),
      method: row.method ?? undefined,
      source: "db",
      recipeId: row.id,
      existingCover: row.imageUrl,
    });
  }

  const dbSlugs = new Set(dbRecipes.map((r) => r.slug));
  for (const recipe of staticRecipes) {
    if (dbSlugs.has(recipe.slug)) continue;
    if (opts.slug && recipe.slug !== opts.slug) continue;
    if (!opts.force && isRealCover(recipe.cover)) continue;
    jobs.push({
      slug: recipe.slug,
      title: recipe.title,
      glass: recipe.glass,
      ingredients: recipe.ingredients,
      method: recipe.method,
      source: "static",
      existingCover: recipe.cover,
    });
  }

  const limited = opts.limit ? jobs.slice(0, opts.limit) : jobs;
  console.log(`🍸 Generating covers for ${limited.length} recipe(s)…`);

  let ok = 0;
  let fail = 0;

  for (const job of limited) {
    const prompt = buildRecipeImagePrompt(job);
    console.log(`\n→ ${job.title} (${job.slug})`);
    if (opts.dryRun) {
      console.log(`  [dry-run] ${prompt.slice(0, 120)}…`);
      continue;
    }

    try {
      const imageUrl = await generateAndUploadRecipeCover(job.slug, {
        title: job.title,
        glass: job.glass,
        ingredients: job.ingredients,
        method: job.method,
      });

      if (job.source === "db" && job.recipeId) {
        await prisma.recipe.update({
          where: { id: job.recipeId },
          data: { imageUrl },
        });
      }

      const idx = staticRecipes.findIndex((r) => r.slug === job.slug);
      if (idx >= 0) {
        staticRecipes[idx] = { ...staticRecipes[idx], cover: imageUrl };
        staticChanged = true;
      }

      console.log(`  ✓ ${imageUrl}`);
      ok += 1;
      await sleep(1100);
    } catch (error) {
      console.error(`  ✗`, error instanceof Error ? error.message : error);
      fail += 1;
    }
  }

  if (staticChanged) {
    await saveStaticRecipes(staticRecipes);
    console.log("\n📝 Updated data/cocktails.json covers");
  }

  console.log(`\nDone: ${ok} ok, ${fail} failed`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
