#!/usr/bin/env tsx
/**
 * Fusiona spirits-import.json → alcohol-encyclopedia.json (canónico único).
 *
 * npm run merge:alcohol-encyclopedia -- --dry-run
 * npm run merge:alcohol-encyclopedia -- --write
 */

import fs from "fs";
import path from "path";
import alcoholData from "@/data/alcohol-encyclopedia.json";
import type { AlcoholRecord } from "@/types/alcohol";
import type { ImportedSpirit } from "@/lib/products/spirits-import";
import {
  findDuplicateSpiritGroups,
  mergeSpiritRecords,
} from "@/lib/alcohol/spirit-id";

const CANON = path.resolve(process.cwd(), "data", "alcohol-encyclopedia.json");
const IMPORT = path.resolve(process.cwd(), "data", "spirits-import.json");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run") || !args.includes("--write");

function main() {
  const existing = alcoholData as AlcoholRecord[];
  const incoming = fs.existsSync(IMPORT)
    ? (JSON.parse(fs.readFileSync(IMPORT, "utf8")) as ImportedSpirit[])
    : [];

  const dupesBefore = findDuplicateSpiritGroups(existing);
  const { merged, added, updated, skippedDuplicates } = mergeSpiritRecords(existing, incoming);
  const dupesAfter = findDuplicateSpiritGroups(merged);

  console.log(`Canónico: ${existing.length} entradas`);
  console.log(`Import: ${incoming.length} candidatos`);
  console.log(`Añadidas: ${added}, actualizadas: ${updated}, duplicados omitidos: ${skippedDuplicates}`);
  console.log(`Duplicados en canónico (antes): ${dupesBefore.length}`);
  console.log(`Duplicados en canónico (después): ${dupesAfter.length}`);

  if (dryRun) {
    console.log("\n(dry-run — usa --write para guardar)");
    return;
  }

  fs.writeFileSync(CANON, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(`\nGuardado: ${CANON} (${merged.length} entradas)`);
}

main();
