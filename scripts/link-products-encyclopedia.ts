#!/usr/bin/env tsx
/**
 * Vincula productos con entradas de alcohol-encyclopedia.json por slug/título.
 * npm run link:products-encyclopedia -- --dry-run
 */

import { config } from "dotenv";
import { resolve } from "path";
import alcoholData from "@/data/alcohol-encyclopedia.json";
import prisma from "@/lib/prisma";
import { normalizeTitle } from "./lib/audit-output";
import type { AlcoholRecord } from "@/types/alcohol";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const dryRun = process.argv.includes("--dry-run");
const alcohols = alcoholData as AlcoholRecord[];
const bySlug = new Map(alcohols.map((a) => [a.slug, a]));
const byTitle = new Map(alcohols.map((a) => [normalizeTitle(a.identity.name_exact), a]));

async function main() {
  const products = await prisma.product.findMany({
    where: { encyclopediaSlug: null, slug: { not: { startsWith: "ingrediente-" } } },
    select: { id: true, slug: true, title: true },
  });

  let linked = 0;
  for (const product of products) {
    const match = bySlug.get(product.slug) ?? byTitle.get(normalizeTitle(product.title));
    if (!match) continue;
    if (!dryRun) {
      await prisma.product.update({
        where: { id: product.id },
        data: { encyclopediaSlug: match.slug },
      });
    }
    console.log(`${dryRun ? "[dry-run] " : ""}${product.slug} → ${match.slug}`);
    linked += 1;
  }

  console.log(`✓ ${linked} producto(s) ${dryRun ? "vinculables" : "vinculados"}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
