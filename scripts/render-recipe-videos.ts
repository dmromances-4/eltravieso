#!/usr/bin/env tsx
/**
 * Render recipe tutorial videos with Remotion and upload to storage.
 *
 * Usage:
 *   tsx scripts/render-recipe-videos.ts [--limit 24] [--slug sweet-martini] [--force] [--dry-run]
 *
 * Requires: npm install (remotion packages). Uses public/brand/travieso mascot SVGs.
 */
import { readFile, mkdir, rm } from "fs/promises";
import path from "path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import prisma from "../lib/prisma";
import { recipeToVideoProps } from "../lib/recipes/video-composition-data";
import { uploadRecipeVideoBuffer } from "../lib/storage/upload-image";
import { parseStoredIngredients } from "../lib/recipes/parse";
import type { CocktailRecord } from "../types/cocktail";

const COCKTAILS_PATH = path.join(process.cwd(), "data/cocktails.json");
const OUT_DIR = path.join(process.cwd(), ".tmp-recipe-videos");

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

async function loadStaticMap(): Promise<Map<string, CocktailRecord>> {
  const raw = await readFile(COCKTAILS_PATH, "utf-8");
  const list = JSON.parse(raw) as CocktailRecord[];
  return new Map(list.map((r) => [r.slug, r]));
}

async function main() {
  const opts = parseArgs();
  const staticMap = await loadStaticMap();

  const dbRecipes = await prisma.recipe.findMany({
    where: opts.slug ? { slug: opts.slug } : undefined,
    select: {
      id: true,
      slug: true,
      title: true,
      glass: true,
      ingredients: true,
      method: true,
      imageUrl: true,
      videoUrl: true,
    },
    orderBy: { createdAt: "desc" },
  });

  let targets = dbRecipes.filter((r) => opts.force || !r.videoUrl);
  if (!targets.length && opts.slug) {
    const staticRecipe = staticMap.get(opts.slug);
    if (staticRecipe) {
      console.log("Slug only in static JSON — seed to DB first or use DB recipes.");
    }
  }

  if (opts.limit) targets = targets.slice(0, opts.limit);

  console.log(`🎬 Rendering ${targets.length} recipe video(s)…`);
  if (opts.dryRun) {
    for (const r of targets) console.log(`  [dry-run] ${r.title}`);
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });

  const entryPoint = path.join(process.cwd(), "remotion/recipe-tutorial/index.ts");
  console.log("Bundling Remotion project…");
  const serveUrl = await bundle({ entryPoint, publicDir: path.join(process.cwd(), "public") });

  let ok = 0;
  let fail = 0;

  for (const recipe of targets) {
    const staticFallback = staticMap.get(recipe.slug);
    const ingredientsRaw = parseStoredIngredients(recipe.ingredients);
    const ingredients = ingredientsRaw.length
      ? ingredientsRaw
      : staticFallback?.ingredients ?? [];
    const method = recipe.method ?? staticFallback?.method ?? "Preparar y servir.";
    const glass = recipe.glass ?? staticFallback?.glass ?? "Copa de autor";
    const cover = recipe.imageUrl ?? staticFallback?.cover;

    const inputProps = recipeToVideoProps({
      title: recipe.title,
      glass,
      ingredients,
      method,
      coverImageUrl: cover && !cover.includes("placeholder") ? cover : undefined,
    });

    const outputPath = path.join(OUT_DIR, `${recipe.slug}.mp4`);
    console.log(`\n→ ${recipe.title}`);

    try {
      const composition = await selectComposition({
        serveUrl,
        id: "RecipeTutorial",
        inputProps,
      });

      await renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        outputLocation: outputPath,
        inputProps,
      });

      const { readFile: readBuf } = await import("fs/promises");
      const buffer = await readBuf(outputPath);
      const videoUrl = await uploadRecipeVideoBuffer(recipe.slug, buffer);

      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { videoUrl },
      });

      console.log(`  ✓ ${videoUrl}`);
      ok += 1;
    } catch (error) {
      console.error(`  ✗`, error instanceof Error ? error.message : error);
      fail += 1;
    }
  }

  await rm(OUT_DIR, { recursive: true, force: true }).catch(() => undefined);
  console.log(`\nDone: ${ok} ok, ${fail} failed`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
