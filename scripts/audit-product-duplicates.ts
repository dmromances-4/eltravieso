#!/usr/bin/env tsx
/**
 * Auditoría de duplicados en productos (shop vs enciclopedia).
 * npm run audit:product-duplicates
 */

import { config } from "dotenv";
import { resolve } from "path";
import alcoholData from "@/data/alcohol-encyclopedia.json";
import prisma from "@/lib/prisma";
import { normalizeTitle, writeAuditReport } from "./lib/audit-output";
import type { AlcoholRecord } from "@/types/alcohol";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const alcohols = alcoholData as AlcoholRecord[];

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      isActive: true,
      category: true,
      metadata: true,
      encyclopediaSlug: true,
      productCode: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const slugCounts = new Map<string, typeof products>();
  for (const product of products) {
    const list = slugCounts.get(product.slug) ?? [];
    list.push(product);
    slugCounts.set(product.slug, list);
  }

  const duplicateSlugs = [...slugCounts.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([slug, list]) => ({ slug, products: list }));

  const ingredientStubs = products.filter((p) => p.slug.startsWith("ingrediente-"));

  const alcoholBySlug = new Map(alcohols.map((a) => [a.slug, a]));
  const alcoholByTitle = new Map(alcohols.map((a) => [normalizeTitle(a.identity.name_exact), a]));

  const encyclopediaMatches = products
    .filter((p) => !p.slug.startsWith("ingrediente-"))
    .map((p) => {
      const bySlug = alcoholBySlug.get(p.slug);
      const byTitle = alcoholByTitle.get(normalizeTitle(p.title));
      const match = bySlug ?? byTitle;
      if (!match) return null;
      return {
        productSlug: p.slug,
        productTitle: p.title,
        encyclopediaSlug: match.slug,
        encyclopediaTitle: match.identity.name_exact,
        linked: p.encyclopediaSlug === match.slug,
      };
    })
    .filter(Boolean);

  const junkCategories = products.filter(
    (p) => p.slug.includes("categoria-") || p.category === "VERMUT" && p.slug.startsWith("categoria"),
  );

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      products: products.length,
      ingredientStubs: ingredientStubs.length,
      duplicateSlugs: duplicateSlugs.length,
      encyclopediaMatches: encyclopediaMatches.length,
      missingProductCode: products.filter((p) => !p.productCode).length,
    },
    duplicateSlugs,
    ingredientStubs: ingredientStubs.map((p) => ({ slug: p.slug, title: p.title, isActive: p.isActive })),
    encyclopediaMatches,
    junkCategories: junkCategories.map((p) => ({ slug: p.slug, title: p.title, category: p.category })),
  };

  const outPath = writeAuditReport("product-duplicates.json", report);
  console.log(`✓ Informe: ${outPath}`);
  console.log(`  Stubs ingrediente-*: ${ingredientStubs.length}`);
  console.log(`  Match enciclopedia: ${encyclopediaMatches.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
