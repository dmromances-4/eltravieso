#!/usr/bin/env tsx
/**
 * Unifica duplicados Prisma cuyo slug existe en cocktails.json (static gana).
 * npm run merge:recipe-duplicates -- --dry-run
 */

import { config } from "dotenv";
import { resolve } from "path";
import cocktailsJson from "@/data/cocktails.json";
import prisma from "@/lib/prisma";
import type { CocktailRecord } from "@/types/cocktail";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const dryRun = process.argv.includes("--dry-run");
const staticRecipes = cocktailsJson as CocktailRecord[];
const staticSlugs = new Set(staticRecipes.map((r) => r.slug));

async function main() {
  const collisions = await prisma.recipe.findMany({
    where: { slug: { in: [...staticSlugs] } },
    include: { technical: true },
  });

  if (!collisions.length) {
    console.log("No hay colisiones slug Prisma/static.");
    return;
  }

  let deleted = 0;
  let preserved = 0;

  for (const recipe of collisions) {
    const staticEntry = staticRecipes.find((s) => s.slug === recipe.slug);
    if (!staticEntry) continue;

    const hasDbExtras = Boolean(recipe.imageUrl || recipe.videoUrl || recipe.isPremium);
    if (hasDbExtras) {
      console.log(`  conservar datos DB en static pendiente: ${recipe.slug} (image/video/premium)`);
      preserved += 1;
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] eliminar Prisma duplicado: ${recipe.slug} (${recipe.id})`);
    } else {
      await prisma.recipe.delete({ where: { id: recipe.id } });
      console.log(`  eliminado: ${recipe.slug}`);
    }
    deleted += 1;
  }

  console.log(`✓ ${deleted} duplicado(s) ${dryRun ? "detectado(s)" : "eliminado(s)"}, ${preserved} con extras DB`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
