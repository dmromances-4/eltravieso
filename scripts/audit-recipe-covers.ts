#!/usr/bin/env tsx
/**
 * Auditoría de cobertura de portadas en cocktails.json (+ Prisma si hay BD).
 * npm run audit:recipe-covers
 */
import { config } from "dotenv";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import cocktailsData from "@/data/cocktails.json";
import prisma from "@/lib/prisma";
import { isPhotoCover, RECIPE_COVER_PLACEHOLDER, shouldRegenerateCover } from "@/lib/recipes/cover-utils";
import type { CocktailRecord } from "@/types/cocktail";

const EXPORT_DIR = resolve(process.cwd(), "data", "exports");

type CoverKind = "photo" | "svg_brand" | "placeholder" | "missing" | "other";

function classifyCover(cover?: string | null): CoverKind {
  if (!cover) return "missing";
  if (isPhotoCover(cover)) return "photo";
  if (cover === RECIPE_COVER_PLACEHOLDER || cover.includes("placeholder")) return "placeholder";
  if (cover.endsWith(".svg")) return "svg_brand";
  return "other";
}

async function main() {
  const records = cocktailsData as CocktailRecord[];
  const byKind: Record<CoverKind, CocktailRecord[]> = {
    photo: [],
    svg_brand: [],
    placeholder: [],
    missing: [],
    other: [],
  };

  for (const row of records) {
    byKind[classifyCover(row.cover)].push(row);
  }

  const pending = records.filter((r) => shouldRegenerateCover(r.cover));

  let prismaTotal = 0;
  let prismaPending = 0;
  let prismaOnlySlugs: string[] = [];
  const prismaBySlug = new Map<string, { imageUrl: string | null; title: string }>();

  try {
    const dbRecipes = await prisma.recipe.findMany({
      select: { slug: true, title: true, imageUrl: true },
    });
    prismaTotal = dbRecipes.length;
    prismaPending = dbRecipes.filter((r) => shouldRegenerateCover(r.imageUrl)).length;
    for (const r of dbRecipes) {
      prismaBySlug.set(r.slug, { imageUrl: r.imageUrl, title: r.title });
    }
    const jsonSlugs = new Set(records.map((r) => r.slug));
    prismaOnlySlugs = dbRecipes.filter((r) => !jsonSlugs.has(r.slug)).map((r) => r.slug);
  } catch (error) {
    console.warn("Prisma no disponible:", error instanceof Error ? error.message : error);
  }

  const mismatch: { slug: string; jsonCover: string | undefined; prismaImage: string | null }[] = [];
  for (const row of records) {
    const db = prismaBySlug.get(row.slug);
    if (!db) continue;
    const jsonPhoto = isPhotoCover(row.cover);
    const prismaPhoto = isPhotoCover(db.imageUrl);
    if (jsonPhoto !== prismaPhoto || (jsonPhoto && row.cover !== db.imageUrl)) {
      mismatch.push({ slug: row.slug, jsonCover: row.cover, prismaImage: db.imageUrl });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    source: resolve(process.cwd(), "data", "cocktails.json"),
    totals: {
      recipes: records.length,
      photo: byKind.photo.length,
      svgBrand: byKind.svg_brand.length,
      placeholder: byKind.placeholder.length,
      missing: byKind.missing.length,
      other: byKind.other.length,
      pendingRegenerate: pending.length,
      prismaTotal,
      prismaPending,
      prismaOnlyInDb: prismaOnlySlugs.length,
      jsonPrismaMismatch: mismatch.length,
    },
    photos: byKind.photo.map((r) => ({ slug: r.slug, title: r.title, cover: r.cover })),
    svgBrand: byKind.svg_brand.map((r) => ({ slug: r.slug, title: r.title, cover: r.cover })),
    placeholder: byKind.placeholder.map((r) => ({ slug: r.slug, title: r.title })),
    pending: pending.map((r) => ({ slug: r.slug, title: r.title, cover: r.cover ?? null })),
    prismaOnlySlugs: prismaOnlySlugs.slice(0, 50),
    mismatch: mismatch.slice(0, 50),
  };

  mkdirSync(EXPORT_DIR, { recursive: true });
  const outPath = resolve(EXPORT_DIR, "recipe-covers-audit.json");
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Recetas en cocktails.json: ${records.length}`);
  console.log(`  Fotos reales:     ${byKind.photo.length}`);
  console.log(`  SVG de marca:     ${byKind.svg_brand.length}`);
  console.log(`  Placeholder:      ${byKind.placeholder.length}`);
  console.log(`  Sin cover:        ${byKind.missing.length}`);
  console.log(`  Otros:            ${byKind.other.length}`);
  console.log(`  Pendientes batch: ${pending.length}`);
  if (prismaTotal) {
    console.log(`Prisma Recipe: ${prismaTotal} (${prismaPending} sin foto)`);
    if (prismaOnlySlugs.length) console.log(`  Solo en Prisma: ${prismaOnlySlugs.length}`);
    if (mismatch.length) console.log(`  Desajuste JSON↔Prisma: ${mismatch.length}`);
  }
  console.log(`Informe: ${outPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
