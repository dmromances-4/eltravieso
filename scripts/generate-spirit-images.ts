#!/usr/bin/env tsx
/**
 * Rellena imageUrl en alcohol-encyclopedia.json desde spirits-import.json.
 * npm run generate:spirit-images -- --write
 */

import fs from "fs";
import path from "path";
import alcoholData from "@/data/alcohol-encyclopedia.json";
import type { AlcoholRecord } from "@/types/alcohol";
import type { ImportedSpirit } from "@/lib/products/spirits-import";

const CANON = path.resolve(process.cwd(), "data", "alcohol-encyclopedia.json");
const IMPORT = path.resolve(process.cwd(), "data", "spirits-import.json");

const write = process.argv.includes("--write");

function main() {
  const records = alcoholData as AlcoholRecord[];
  const imports = fs.existsSync(IMPORT)
    ? (JSON.parse(fs.readFileSync(IMPORT, "utf8")) as ImportedSpirit[])
    : [];

  const imageBySource = new Map<string, string>();
  const imageBySlug = new Map<string, string>();
  for (const item of imports) {
    if (item.imageUrl && item.sourceUrl) imageBySource.set(item.sourceUrl, item.imageUrl);
    if (item.imageUrl) imageBySlug.set(item.slug, item.imageUrl);
  }

  let filled = 0;
  for (const record of records) {
    if (record.imageUrl) continue;
    const fromSource = record.sourceUrl ? imageBySource.get(record.sourceUrl) : undefined;
    const fromSlug = record.linkedProductSlug
      ? imageBySlug.get(record.linkedProductSlug)
      : imageBySlug.get(record.slug);
    const image = fromSource ?? fromSlug;
    if (image) {
      record.imageUrl = image;
      record.updatedAt = new Date().toISOString();
      filled += 1;
    }
  }

  console.log(`Imágenes asignadas: ${filled} / ${records.length}`);

  if (write) {
    fs.writeFileSync(CANON, `${JSON.stringify(records, null, 2)}\n`, "utf8");
    console.log(`Guardado: ${CANON}`);
  } else {
    console.log("(dry-run — usa --write)");
  }
}

main();
