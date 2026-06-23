#!/usr/bin/env tsx
/**
 * Normaliza IDs, fusiona duplicados y mejora datos en alcohol-encyclopedia.json
 *
 * npm run normalize:alcohol-encyclopedia -- --dry-run
 * npm run normalize:alcohol-encyclopedia -- --write
 */

import fs from "fs";
import path from "path";
import alcoholData from "@/data/alcohol-encyclopedia.json";
import type { AlcoholRecord } from "@/types/alcohol";
import type { ImportedSpirit } from "@/lib/products/spirits-import";
import { normalizeEncyclopediaRecords } from "@/lib/alcohol/normalize-encyclopedia";
import { writeJsonAtomic } from "@/lib/alcohol/write-json-atomic";

const CANON = path.resolve(process.cwd(), "data", "alcohol-encyclopedia.json");
const IMPORT = path.resolve(process.cwd(), "data", "spirits-import.json");

const write = process.argv.includes("--write");

function main() {
  const existing = alcoholData as AlcoholRecord[];
  const imports = fs.existsSync(IMPORT)
    ? (JSON.parse(fs.readFileSync(IMPORT, "utf8")) as ImportedSpirit[])
    : [];

  const result = normalizeEncyclopediaRecords(existing, imports);

  console.log(`Antes: ${existing.length} entradas`);
  console.log(`Después: ${result.records.length} entradas`);
  console.log(`productCode rellenados: ${result.productCodesFilled}`);
  console.log(`id sincronizados: ${result.idsSynced}`);
  console.log(`fusionados (slugs eliminados): ${result.removedSlugs.length}`);
  if (result.removedSlugs.length > 0) {
    console.log(`  → ${result.removedSlugs.slice(0, 10).join(", ")}${result.removedSlugs.length > 10 ? "…" : ""}`);
  }
  console.log(`ABV extraídos del título: ${result.abvFilled}`);
  console.log(`imageUrl rellenadas: ${result.imagesFilled}`);

  if (!write) {
    console.log("\n(dry-run — usa --write para guardar)");
    return;
  }

  writeJsonAtomic(CANON, result.records);
  console.log(`\nGuardado: ${CANON}`);
}

main();
