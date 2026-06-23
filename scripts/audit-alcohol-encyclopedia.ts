#!/usr/bin/env tsx
/**
 * Auditoría de alcohol-encyclopedia.json
 * npm run audit:alcohol-encyclopedia
 */

import fs from "fs";
import path from "path";
import alcoholData from "@/data/alcohol-encyclopedia.json";
import type { AlcoholRecord } from "@/types/alcohol";
import { findDuplicateSpiritGroups } from "@/lib/alcohol/spirit-id";
import { baseSlugForPackaging } from "@/lib/alcohol/normalize-encyclopedia";
import { normalizeTitle } from "./lib/audit-output";

const CANON = path.resolve(process.cwd(), "data", "alcohol-encyclopedia.json");
const IMPORT = path.resolve(process.cwd(), "data", "spirits-import.json");
const EXPORT_DIR = path.resolve(process.cwd(), "data", "exports");

function main() {
  const records = alcoholData as AlcoholRecord[];
  const imports = fs.existsSync(IMPORT)
    ? (JSON.parse(fs.readFileSync(IMPORT, "utf8")) as { slug: string }[])
    : [];

  const slugCounts = new Map<string, number>();
  const sourceCounts = new Map<string, number>();
  const titleCounts = new Map<string, string[]>();
  const codeCounts = new Map<string, string[]>();

  for (const record of records) {
    slugCounts.set(record.slug, (slugCounts.get(record.slug) ?? 0) + 1);
    const code = record.productCode ?? record.id;
    const codes = codeCounts.get(code) ?? [];
    codes.push(record.slug);
    codeCounts.set(code, codes);

    if (record.sourceUrl) {
      const key = record.sourceUrl.split("#")[0];
      sourceCounts.set(key, (sourceCounts.get(key) ?? 0) + 1);
    }

    const titleKey = normalizeTitle(record.identity.name_exact);
    const titles = titleCounts.get(titleKey) ?? [];
    titles.push(record.slug);
    titleCounts.set(titleKey, titles);
  }

  const duplicateSlugs = [...slugCounts.entries()].filter(([, n]) => n > 1);
  const duplicateSources = [...sourceCounts.entries()].filter(([, n]) => n > 1);
  const duplicateTitles = [...titleCounts.entries()].filter(([, a]) => a.length > 1);
  const duplicateCodes = [...codeCounts.entries()].filter(([, a]) => a.length > 1);
  const identityGroups = findDuplicateSpiritGroups(records);

  const packagingVariants: { variant: string; base: string }[] = [];
  const slugSet = new Set(records.map((r) => r.slug));
  for (const record of records) {
    const base = baseSlugForPackaging(record.slug);
    if (base && slugSet.has(base)) {
      packagingVariants.push({ variant: record.slug, base });
    }
  }

  const encSlugs = new Set(records.map((r) => r.slug));
  const missingInCanon = imports.filter((i) => !encSlugs.has(i.slug)).map((i) => i.slug);

  const withoutProductCode = records.filter((r) => !r.productCode).length;
  const withoutImage = records.filter((r) => !r.imageUrl).length;
  const withSpCode = records.filter((r) => r.productCode && /^SP-\d{4}$/.test(r.productCode)).length;

  const report = {
    generatedAt: new Date().toISOString(),
    source: CANON,
    totals: {
      entries: records.length,
      withProductCode: records.length - withoutProductCode,
      withSpProductCode: withSpCode,
      withoutImage,
      imports: imports.length,
      missingInCanon: missingInCanon.length,
    },
    duplicates: {
      slugs: duplicateSlugs.length,
      sourceUrls: duplicateSources.length,
      titles: duplicateTitles.length,
      productCodes: duplicateCodes.length,
      identityGroups: identityGroups.length,
      packagingVariants: packagingVariants.length,
    },
    duplicateSlugs,
    duplicateSources: duplicateSources.slice(0, 20),
    duplicateTitles: duplicateTitles.slice(0, 20).map(([title, slugs]) => ({ title, slugs })),
    duplicateCodes: duplicateCodes.slice(0, 20).map(([code, slugs]) => ({ code, slugs })),
    identityGroups: identityGroups.slice(0, 20),
    packagingVariants,
    missingInCanon: missingInCanon.slice(0, 50),
  };

  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  const outPath = path.join(EXPORT_DIR, "alcohol-audit.json");
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Entradas: ${records.length}`);
  console.log(`productCode: ${records.length - withoutProductCode} (${withSpCode} SP-NNNN)`);
  console.log(`sin imageUrl: ${withoutImage}`);
  console.log(`Duplicados slug: ${duplicateSlugs.length}, sourceUrl: ${duplicateSources.length}, identity: ${identityGroups.length}`);
  console.log(`Variantes packaging (-estuche): ${packagingVariants.length}`);
  console.log(`Import no en canónico: ${missingInCanon.length}`);
  console.log(`Informe: ${outPath}`);
}

main();
