#!/usr/bin/env tsx
/**
 * Orquestador unificado: productos, recetas y locales.
 *
 * npm run sync:catalog
 * npm run sync:catalog -- --only products
 * npm run sync:catalog -- --only recipes --limit 50
 * npm run sync:catalog -- --only venues --detail-only
 * npm run sync:catalog -- --dry-run --skip-scrape
 * npm run sync:catalog -- --seed --geocode
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { mergeEnrichProducts } from "./enrich-ecommerce-products";
import { buildProductsFromCsv, loadProductsJson, PRODUCTS_OUTPUT } from "./build-products";
import { runProductScrape } from "./scrape-products";
import { importOldRecipes } from "./import-old-recipes";
import { runAuditRecipes } from "./audit-recipes";
import { runVenueScrape, VENUES_OUTPUT } from "./scrape-worlds50best";
import { seedVenuesGuide } from "./seed-venues-guide";
import { mergeProductsBySlug, normalizeCocktailsFile } from "@/lib/catalog/merge";
import {
  createReport,
  finalizeReport,
  printReportSummary,
  writeReport,
  type CatalogSyncReport,
  type SyncPhaseResult,
} from "@/lib/catalog/sync-report";
import { seedCatalogFromJson } from "@/lib/catalog/seed-from-json";
import { saveCocktails } from "@/lib/recipes/cocktails-io";
import prisma from "@/lib/prisma";

type CatalogDomain = "products" | "recipes" | "venues";

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function parseDomains(): CatalogDomain[] {
  const only = argValue("--only");
  if (!only) return ["products", "recipes", "venues"];
  const domains = only.split(",").map((s) => s.trim()) as CatalogDomain[];
  const valid: CatalogDomain[] = [];
  for (const d of domains) {
    if (d === "products" || d === "recipes" || d === "venues") valid.push(d);
  }
  return valid.length ? valid : ["products", "recipes", "venues"];
}

function writeProductsJson(products: ReturnType<typeof loadProductsJson>, dryRun: boolean) {
  if (dryRun) return;
  const dir = path.dirname(PRODUCTS_OUTPUT);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PRODUCTS_OUTPUT, `${JSON.stringify(products, null, 2)}\n`, "utf-8");
}

async function phaseProducts(options: {
  dryRun: boolean;
  skipScrape: boolean;
  limit?: number;
}): Promise<SyncPhaseResult> {
  console.log("\n══ Fase productos ══");
  let products = loadProductsJson();
  let added = 0;
  let skipped = 0;
  let errors = 0;

  const fromCsv = await buildProductsFromCsv();
  const csvMerge = mergeProductsBySlug(products, fromCsv, { mode: "insert-only" });
  products = csvMerge.merged;
  added += csvMerge.added;
  skipped += csvMerge.skipped;
  console.log(`  CSV: +${csvMerge.added} (${fromCsv.length} filas únicas en Productos/)`);

  const enrichMerge = mergeEnrichProducts(products);
  products = enrichMerge.merged;
  added += enrichMerge.added;
  skipped += enrichMerge.skipped;
  console.log(`  Enrich e-commerce: +${enrichMerge.added}`);

  if (!options.skipScrape) {
    const scrape = await runProductScrape({
      existing: products,
      dryRun: true,
      maxUrls: options.limit ?? Number(process.env.MAX_URLS ?? 40),
    });
    products = scrape.products;
    added += scrape.phase.added;
    skipped += scrape.phase.skipped;
    errors += scrape.phase.errors;
  }

  writeProductsJson(products, options.dryRun);
  console.log(`✓ Productos: ${products.length} total (+${added} nuevos)`);

  return { added, skipped, total: products.length, errors };
}

async function phaseRecipes(options: {
  dryRun: boolean;
  skipScrape: boolean;
  limit?: number;
}): Promise<SyncPhaseResult> {
  console.log("\n══ Fase recetas ══");
  const importResult = await importOldRecipes({ dryRun: true });
  let recipes = importResult.recipes;
  let added = importResult.phase.added;
  let skipped = importResult.phase.skipped;

  const { normalized, skipped: normSkipped } = normalizeCocktailsFile(recipes);
  recipes = normalized;
  skipped += normSkipped;

  if (!options.dryRun) {
    saveCocktails(recipes, { skipBackup: false });
  }
  console.log(`  Import/normalize: ${recipes.length} recetas (${normSkipped} duplicados/basura omitidos)`);

  let auditResult: SyncPhaseResult = { added: 0, skipped: 0, total: recipes.length, errors: 0 };
  if (!options.skipScrape) {
    auditResult = await runAuditRecipes({
      from: "pending",
      limit: options.limit ?? 50,
      dryRun: options.dryRun,
    });
  }

  return {
    added: added + auditResult.added,
    skipped: skipped + auditResult.skipped,
    total: recipes.length,
    errors: auditResult.errors,
  };
}

async function phaseVenues(options: {
  dryRun: boolean;
  skipScrape: boolean;
  detailOnly: boolean;
}): Promise<SyncPhaseResult> {
  console.log("\n══ Fase locales ══");
  if (options.skipScrape) {
    const existing = fs.existsSync(VENUES_OUTPUT)
      ? (JSON.parse(fs.readFileSync(VENUES_OUTPUT, "utf-8")) as unknown[]).length
      : 0;
    console.log(`  skip-scrape: ${existing} locales en JSON sin cambios`);
    return { added: 0, skipped: existing, total: existing, errors: 0 };
  }

  return runVenueScrape({
    detailOnly: options.detailOnly,
    dryRun: options.dryRun,
  });
}

async function phaseSeed(options: {
  geocode: boolean;
  domains: CatalogDomain[];
}): Promise<SyncPhaseResult> {
  console.log("\n══ Fase seed (Postgres) ══");
  let added = 0;
  let skipped = 0;
  let total = 0;
  let errors = 0;

  if (options.domains.includes("products")) {
    const r = await seedCatalogFromJson({ products: true, recipes: false });
    if (r.products) {
      added += r.products.added;
      skipped += r.products.skipped;
      total += r.products.total;
    }
  }

  if (options.domains.includes("recipes")) {
    const r = await seedCatalogFromJson({ products: false, recipes: true });
    if (r.recipes) {
      added += r.recipes.added;
      skipped += r.recipes.skipped;
      total += r.recipes.total;
    }
  }

  if (options.domains.includes("venues")) {
    const r = await seedVenuesGuide({ geocode: options.geocode });
    added += r.added;
    skipped += r.skipped;
    total += r.total;
    errors += r.errors;
  }

  if (options.geocode && !options.domains.includes("venues")) {
    try {
      execSync("npx tsx scripts/geocode-venues-guide.ts", { stdio: "inherit" });
    } catch {
      errors += 1;
    }
  }

  return { added, skipped, total, errors };
}

async function main() {
  const dryRun = hasFlag("--dry-run");
  const skipScrape = hasFlag("--skip-scrape");
  const seed = hasFlag("--seed");
  const geocode = hasFlag("--geocode");
  const tripadvisorSuggest = hasFlag("--tripadvisor-suggest");
  const detailOnly = hasFlag("--detail-only") || !hasFlag("--full-venues");
  const limit = Number(argValue("--limit") ?? "0") || undefined;
  const domains = parseDomains();

  const report: CatalogSyncReport = createReport({ dryRun, skipScrape, seed });

  console.log("🔄 sync:catalog");
  console.log(`  dominios: ${domains.join(", ")}`);
  console.log(`  dry-run=${dryRun} skip-scrape=${skipScrape} seed=${seed} detail-only=${detailOnly}`);

  if (domains.includes("products")) {
    report.phases.products = await phaseProducts({ dryRun, skipScrape, limit });
  }

  if (domains.includes("recipes")) {
    report.phases.recipes = await phaseRecipes({ dryRun, skipScrape, limit });
  }

  if (domains.includes("venues")) {
    report.phases.venues = await phaseVenues({ dryRun, skipScrape, detailOnly });
  }

  if (seed && !dryRun) {
    report.phases.seed = await phaseSeed({ geocode, domains });
  }

  if (tripadvisorSuggest && !dryRun) {
    console.log("\n══ TripAdvisor suggest ══");
    try {
      execSync("npx tsx scripts/enrich-venues-tripadvisor.ts --suggest", { stdio: "inherit" });
    } catch {
      console.warn("  enrich:tripadvisor falló (continuando)");
    }
  }

  finalizeReport(report);
  const reportPath = writeReport(report);
  printReportSummary(report);
  console.log(`\nInforme: ${reportPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
