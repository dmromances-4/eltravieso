#!/usr/bin/env tsx
/**
 * Diagnóstico rápido de errores en alcohol-encyclopedia.json
 * Escribe en debug-b8d73d.log (NDJSON) + consola.
 */
import fs from "fs";
import path from "path";
import type { AlcoholRecord } from "@/types/alcohol";
import { findDuplicateSpiritGroups } from "@/lib/alcohol/spirit-id";
import { baseSlugForPackaging } from "@/lib/alcohol/normalize-encyclopedia";

const LOG = path.resolve(process.cwd(), "debug-b8d73d.log");
const CANON = path.resolve(process.cwd(), "data", "alcohol-encyclopedia.json");

function log(hypothesisId: string, message: string, data: Record<string, unknown>) {
  const line = JSON.stringify({
    sessionId: "b8d73d",
    hypothesisId,
    location: "scripts/diagnose-alcohol-errors.ts",
    message,
    data,
    timestamp: Date.now(),
    runId: "diagnose",
  });
  fs.appendFileSync(LOG, `${line}\n`, "utf8");
  console.log(message, data);
}

function main() {
  const records = JSON.parse(fs.readFileSync(CANON, "utf8")) as AlcoholRecord[];
  const slugSet = new Set(records.map((r) => r.slug));

  const noProductCode = records.filter((r) => !r.productCode);
  const packagingVariants = records.filter((r) => {
    const base = baseSlugForPackaging(r.slug);
    return base != null && slugSet.has(base);
  });
  const identityDupes = findDuplicateSpiritGroups(records);
  const slugDupes = new Map<string, number>();
  for (const r of records) slugDupes.set(r.slug, (slugDupes.get(r.slug) ?? 0) + 1);
  const dupSlugs = [...slugDupes.entries()].filter(([, n]) => n > 1);
  const placeholderAbv = records.filter((r) => r.technical?.abv === "—").length;
  const estucheSlugs = records.filter((r) => r.slug.endsWith("-estuche")).length;

  const findings = {
    total: records.length,
    noProductCode: noProductCode.length,
    packagingVariantsWithBase: packagingVariants.length,
    estucheSlugs,
    identityDuplicateGroups: identityDupes.length,
    slugDuplicates: dupSlugs.length,
    placeholderAbv,
  };

  log("H1", "data_integrity", findings);
  if (packagingVariants.length > 0) {
    log("H2", "packaging_dupes_sample", {
      samples: packagingVariants.slice(0, 5).map((r) => ({
        variant: r.slug,
        base: baseSlugForPackaging(r.slug),
      })),
    });
  }
  if (noProductCode.length > 0) {
    log("H3", "missing_product_code", {
      slugs: noProductCode.slice(0, 10).map((r) => r.slug),
    });
  }
  if (identityDupes.length > 0) {
    log("H4", "identity_duplicate_groups", { groups: identityDupes.slice(0, 5) });
  }

  log("H5", "index_page_risk", {
    cardsRenderedOnLoad: records.length,
    note: "AlcoholesClient renders all filtered cards without pagination",
  });

  console.log("\nDiagnóstico guardado en", LOG);
}

main();
