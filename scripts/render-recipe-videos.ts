#!/usr/bin/env tsx

/**

 * Render recipe tutorial videos with Remotion and upload to storage.

 *

 * Usage:

 *   tsx scripts/render-recipe-videos.ts [--limit 24] [--slug negroni] [--force] [--dry-run]

 *   tsx scripts/render-recipe-videos.ts --discover-only --slug negroni

 *   tsx scripts/render-recipe-videos.ts --report

 *   tsx scripts/render-recipe-videos.ts --require-cover --limit 5

 *   tsx scripts/render-recipe-videos.ts --polish --slug negroni --discover-only

 *

 * Requires: npm install (remotion packages). Uses public/brand/travieso mascot SVGs.

 */

import { execFile } from "child_process";

import { readFile, mkdir, rm, writeFile } from "fs/promises";

import path from "path";

import { promisify } from "util";

import prisma from "../lib/prisma";

import { recipeToVideoProps, recipeToVideoTimeline } from "../lib/recipes/video-composition-data";

import { polishVideoSteps, polishedStepsToMethod } from "../lib/recipes/video-prompt";

import { uploadRecipeVideoBuffer } from "../lib/storage/upload-image";

import { parseStoredIngredients } from "../lib/recipes/parse";

import type { CocktailRecord } from "../types/cocktail";



const execFileAsync = promisify(execFile);

const COCKTAILS_PATH = path.join(process.cwd(), "data/cocktails.json");

const OUT_DIR = path.join(process.cwd(), ".tmp-recipe-videos");

const REMOTION_ENTRY = "remotion/recipe-tutorial/index.ts";



type CliOptions = {

  limit?: number;

  slug?: string;

  force: boolean;

  dryRun: boolean;

  discoverOnly: boolean;

  report: boolean;

  requireCover: boolean;

  polish: boolean;

};



function parseArgs(): CliOptions {

  const args = process.argv.slice(2);

  const opts: CliOptions = {

    force: false,

    dryRun: false,

    discoverOnly: false,

    report: false,

    requireCover: false,

    polish: false,

  };

  for (let i = 0; i < args.length; i += 1) {

    const arg = args[i];

    if (arg === "--force") opts.force = true;

    else if (arg === "--dry-run") opts.dryRun = true;

    else if (arg === "--discover-only") opts.discoverOnly = true;

    else if (arg === "--report") opts.report = true;

    else if (arg === "--require-cover") opts.requireCover = true;

    else if (arg === "--polish") opts.polish = true;

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



function resolveCover(

  imageUrl: string | null | undefined,

  staticCover: string | undefined,

): string | undefined {

  const cover = imageUrl ?? staticCover;

  if (!cover || cover.includes("placeholder")) return undefined;

  return cover;

}



type RecipeTarget = {

  id?: string;

  slug: string;

  title: string;

  glass: string;

  ingredients: string[];

  method: string;

  coverImageUrl?: string;

  videoUrl?: string | null;

};



function buildTarget(

  recipe: {

    id: string;

    slug: string;

    title: string;

    glass: string | null;

    ingredients: string;

    method: string | null;

    imageUrl: string | null;

    videoUrl: string | null;

  },

  staticFallback?: CocktailRecord,

): RecipeTarget {

  const ingredientsRaw = parseStoredIngredients(recipe.ingredients);

  const ingredients = ingredientsRaw.length ? ingredientsRaw : staticFallback?.ingredients ?? [];

  return {

    id: recipe.id,

    slug: recipe.slug,

    title: recipe.title,

    glass: recipe.glass ?? staticFallback?.glass ?? "Copa de autor",

    ingredients,

    method: recipe.method ?? staticFallback?.method ?? "Preparar y servir.",

    coverImageUrl: resolveCover(recipe.imageUrl, staticFallback?.cover),

    videoUrl: recipe.videoUrl,

  };

}



async function resolveMethod(target: RecipeTarget, polish: boolean): Promise<string> {

  if (!polish) return target.method;

  const polished = await polishVideoSteps({

    title: target.title,

    glass: target.glass,

    ingredients: target.ingredients,

    method: target.method,

  });

  if (!polished?.length) {

    console.warn(`  [polish] IA no disponible o respuesta inválida — usando método original (${target.slug})`);

    return target.method;

  }

  console.log(`  [polish] ${polished.length} pasos refinados para ${target.slug}`);

  return polishedStepsToMethod(polished);

}



async function renderWithRemotionCli(slug: string, props: ReturnType<typeof recipeToVideoProps>, outputPath: string) {

  const propsPath = path.join(OUT_DIR, `${slug}-props.json`);

  await writeFile(propsPath, JSON.stringify(props));

  await execFileAsync(

    "npx",

    ["remotion", "render", REMOTION_ENTRY, "RecipeTutorial", outputPath, `--props=${propsPath}`],

    { cwd: process.cwd(), maxBuffer: 20 * 1024 * 1024 },

  );

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



  let targets: RecipeTarget[] = dbRecipes.map((r) => buildTarget(r, staticMap.get(r.slug)));



  if (!targets.length && opts.slug) {

    const staticRecipe = staticMap.get(opts.slug);

    if (staticRecipe) {

      targets = [

        {

          slug: staticRecipe.slug,

          title: staticRecipe.title,

          glass: staticRecipe.glass ?? "Copa de autor",

          ingredients: staticRecipe.ingredients ?? [],

          method: staticRecipe.method ?? "Preparar y servir.",

          coverImageUrl: resolveCover(undefined, staticRecipe.cover),

        },

      ];

      console.log(`Using static JSON only for slug "${opts.slug}" (not in DB).`);

    }

  }



  if (!opts.force && !opts.discoverOnly && !opts.report) {

    targets = targets.filter((r) => !r.videoUrl);

  }



  if (opts.requireCover) {

    targets = targets.filter((r) => r.coverImageUrl);

  }



  if (opts.limit) targets = targets.slice(0, opts.limit);



  if (opts.report) {

    console.log("slug\tcover\tvideo\tbeats\tgags\tseconds");

    for (const t of targets) {

      const method = await resolveMethod(t, opts.polish);

      const timeline = recipeToVideoTimeline({

        title: t.title,

        glass: t.glass,

        ingredients: t.ingredients,

        method,

        coverImageUrl: t.coverImageUrl,

      });

      const gags = timeline.beats.filter((b) => b.cartoonMotion?.gag).length;

      const seconds = Math.round((timeline.totalFrames / timeline.fps) * 10) / 10;

      console.log(

        `${t.slug}\t${t.coverImageUrl ? "yes" : "no"}\t${t.videoUrl ? "yes" : "no"}\t${timeline.beats.length}\t${gags}\t${seconds}`,

      );

    }

    return;

  }



  if (opts.discoverOnly) {

    for (const t of targets) {

      const method = await resolveMethod(t, opts.polish);

      const timeline = recipeToVideoTimeline({

        title: t.title,

        glass: t.glass,

        ingredients: t.ingredients,

        method,

        coverImageUrl: t.coverImageUrl,

      });

      console.log(`\n=== ${t.title} (${t.slug}) ===`);

      console.log(

        JSON.stringify(

          {

            introTagline: timeline.introTagline,

            liquidTone: timeline.liquidTone,

            garnish: timeline.garnish,

            totalFrames: timeline.totalFrames,

            durationSeconds: Math.round((timeline.totalFrames / timeline.fps) * 10) / 10,

            beats: timeline.beats.map((b) => ({

              kind: b.kind,

              durationFrames: b.durationFrames,

              text: b.text,

              subtext: b.subtext,

              technique: b.technique,

              mascotPose: b.mascotPose,

              cartoonMotion: b.cartoonMotion,

              gag: b.cartoonMotion?.gag,

              cartoonPrompt: b.cartoonPrompt,

            })),

          },

          null,

          2,

        ),

      );

    }

    return;

  }



  console.log(`🎬 Rendering ${targets.length} recipe video(s)…`);

  if (opts.dryRun) {

    for (const r of targets) console.log(`  [dry-run] ${r.title}`);

    return;

  }



  if (!targets.length) {

    console.log("No targets. Try --slug, --force, or seed recipes to DB.");

    return;

  }



  await mkdir(OUT_DIR, { recursive: true });



  let ok = 0;

  let fail = 0;



  for (const recipe of targets) {

    const method = await resolveMethod(recipe, opts.polish);

    const inputProps = recipeToVideoProps({

      title: recipe.title,

      glass: recipe.glass,

      ingredients: recipe.ingredients,

      method,

      coverImageUrl: recipe.coverImageUrl,

    });



    const outputPath = path.join(OUT_DIR, `${recipe.slug}.mp4`);

    console.log(`\n→ ${recipe.title} (${inputProps.totalFrames ?? "?"} frames, ${inputProps.beats?.length ?? 0} beats)`);



    try {

      await renderWithRemotionCli(recipe.slug, inputProps, outputPath);



      const buffer = await readFile(outputPath);

      const videoUrl = await uploadRecipeVideoBuffer(recipe.slug, buffer);



      if (recipe.id) {

        await prisma.recipe.update({

          where: { id: recipe.id },

          data: { videoUrl },

        });

      }



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

