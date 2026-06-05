#!/usr/bin/env tsx
/**
 * Prepara lotes JSON para importar recetas a Notion vía MCP `notion-create-pages`.
 *
 * npm run export:cocktails-fichas -- --format notion --limit 20
 * npm run import:cocktails-notion -- --input data/exports/cocktail-fichas-notion-*.json
 *
 * Variables opcionales:
 * - NOTION_DATA_SOURCE_ID — collection id (default en docs/FICHAS-COCTEL.md)
 */

import fs from "fs";
import path from "path";
import type { NotionExportRow } from "@/lib/recipes/export-cocktail-fichas";

const DEFAULT_DATA_SOURCE = "d8df242c-de72-49f9-83cd-e6383aaf503b";
const VASOS = new Set(["Copa de martini", "Copa de cóctel", "Copa coupe", "Highball", "Rocks", "Otro"]);

function argValue(flag: string) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function mapVaso(glass: string) {
  return VASOS.has(glass) ? glass : "Otro";
}

function argList(flag: string) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return [];
  const values: string[] = [];
  for (let i = idx + 1; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith("--")) break;
    values.push(arg);
  }
  return values;
}

function loadSkipSlugs(): Set<string> {
  const slugs = new Set<string>();
  for (const slug of argList("--skip-slug")) {
    slugs.add(slug);
  }
  const skipFile = argValue("--skip-slugs-file");
  if (skipFile && fs.existsSync(skipFile)) {
    for (const line of fs.readFileSync(skipFile, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (trimmed) slugs.add(trimmed);
    }
  }
  return slugs;
}

function toPage(row: NotionExportRow) {
  const p = row.notionProperties;
  return {
    properties: {
      Nombre: p.Nombre,
      Slug: p.Slug,
      Vaso: mapVaso(p.Vaso),
      ABV: p.ABV,
      Kcal: p.Kcal,
      Rating: p.Rating,
      "Estado revisión": p["Estado revisión"],
      "URL web": p["URL web"],
      "Difford's": p["Difford's"] || null,
      Ingredientes: p.Ingredientes,
      Preparación: p.Preparación,
    },
  };
}

function main() {
  const input = argValue("--input");
  if (!input) {
    console.error("Uso: npm run import:cocktails-notion -- --input data/exports/cocktail-fichas-notion-....json");
    process.exit(1);
  }

  const resolved = input.includes("*")
    ? fs.readdirSync(path.dirname(input)).find((f) => f.startsWith("cocktail-fichas-notion"))
    : input;
  const filePath = resolved && !input.includes("*") ? input : path.join(path.dirname(input), resolved ?? "");
  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`No se encontró export: ${input}`);
    process.exit(1);
  }

  const rows = JSON.parse(fs.readFileSync(filePath, "utf8")) as NotionExportRow[];
  const skipSlugs = loadSkipSlugs();
  const filtered = skipSlugs.size
    ? rows.filter((row) => !skipSlugs.has(row.slug))
    : rows;
  const pages = filtered.map(toPage);
  const dataSourceId = process.env.NOTION_DATA_SOURCE_ID ?? DEFAULT_DATA_SOURCE;
  const batchSize = Number(argValue("--batch-size") ?? "10");
  const outDir = path.join(process.cwd(), "data", "exports");
  fs.mkdirSync(outDir, { recursive: true });

  const batches: string[] = [];
  for (let i = 0; i < pages.length; i += batchSize) {
    const chunk = pages.slice(i, i + batchSize);
    const name = `notion-mcp-batch-${String(Math.floor(i / batchSize) + 1).padStart(2, "0")}.json`;
    const payload = { parent: { data_source_id: dataSourceId }, pages: chunk };
    const outPath = path.join(outDir, name);
    fs.writeFileSync(outPath, `${JSON.stringify(payload)}\n`, "utf8");
    batches.push(outPath);
  }

  console.log(
    `Preparados ${pages.length} pages (${rows.length - pages.length} omitidas por slug) en ${batches.length} lote(s):`,
  );
  for (const b of batches) console.log(`  ${b}`);
  console.log("\nImportar con Notion MCP: notion-create-pages por cada lote.");
}

main();
