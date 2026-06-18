#!/usr/bin/env tsx
/**
 * Auditoría de duplicados en recetas (static vs Prisma).
 * npm run audit:recipe-duplicates
 */

import { config } from "dotenv";
import { resolve } from "path";
import cocktailsJson from "@/data/cocktails.json";
import prisma from "@/lib/prisma";
import { normalizeTitle, writeAuditReport } from "./lib/audit-output";
import type { CocktailRecord } from "@/types/cocktail";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const staticRecipes = cocktailsJson as CocktailRecord[];
const staticSlugs = new Set(staticRecipes.map((r) => r.slug));
const staticIds = new Set(staticRecipes.map((r) => r.id));

async function main() {
  const dbRecipes = await prisma.recipe.findMany({
    select: { id: true, slug: true, title: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const slugCollisions = dbRecipes
    .filter((r) => staticSlugs.has(r.slug))
    .map((r) => ({
      slug: r.slug,
      prismaId: r.id,
      title: r.title,
      staticId: staticRecipes.find((s) => s.slug === r.slug)?.id ?? null,
    }));

  const staticByNormTitle = new Map<string, CocktailRecord[]>();
  for (const recipe of staticRecipes) {
    const key = normalizeTitle(recipe.title);
    const list = staticByNormTitle.get(key) ?? [];
    list.push(recipe);
    staticByNormTitle.set(key, list);
  }

  const staticTitleDupes = [...staticByNormTitle.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([title, list]) => ({ normalizedTitle: title, recipes: list.map((r) => ({ id: r.id, slug: r.slug, title: r.title })) }));

  const dbByNormTitle = new Map<string, typeof dbRecipes>();
  for (const recipe of dbRecipes) {
    const key = normalizeTitle(recipe.title);
    const list = dbByNormTitle.get(key) ?? [];
    list.push(recipe);
    dbByNormTitle.set(key, list);
  }

  const semanticDupes = [...dbByNormTitle.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([title, list]) => ({
      normalizedTitle: title,
      recipes: list.map((r) => ({ id: r.id, slug: r.slug, title: r.title })),
    }));

  const orphanDbSlugs = dbRecipes
    .filter((r) => !staticSlugs.has(r.slug) && /-\d+$/.test(r.slug))
    .map((r) => ({ id: r.id, slug: r.slug, title: r.title }));

  const orphanStaticIds = staticRecipes
    .filter((r) => !r.id.startsWith("dg-") && !r.id.startsWith("slug-"))
    .map((r) => ({ id: r.id, slug: r.slug, title: r.title }));

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      static: staticRecipes.length,
      prisma: dbRecipes.length,
      slugCollisions: slugCollisions.length,
      staticTitleDupes: staticTitleDupes.length,
      semanticDupes: semanticDupes.length,
    },
    slugCollisions,
    staticTitleDupes,
    semanticDupes,
    orphanDbSlugs,
    orphanStaticIds,
    staticIdsSample: [...staticIds].slice(0, 5),
  };

  const outPath = writeAuditReport("recipe-duplicates.json", report);
  console.log(`✓ Informe: ${outPath}`);
  console.log(`  Colisiones slug static/Prisma: ${slugCollisions.length}`);
  console.log(`  Duplicados semánticos Prisma: ${semanticDupes.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
