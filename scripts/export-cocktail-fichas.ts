#!/usr/bin/env tsx
/**
 * Exporta fichas editoriales desde cocktails.json para Figma / Notion / CSV.
 *
 * npm run export:cocktails-fichas
 * npm run export:cocktails-fichas -- --limit 20
 * npm run export:cocktails-fichas -- --all --format csv
 * npm run export:cocktails-fichas -- --format notion --limit 20
 */

import fs from "fs";
import path from "path";
import { loadCocktails } from "@/lib/recipes/cocktails-io";
import { buildExportPayload, parseExportArgs } from "@/lib/recipes/export-cocktail-fichas";

const EXPORTS_DIR = path.join(process.cwd(), "data", "exports");

function writeExport(content: string, filename: string) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  const outPath = path.join(EXPORTS_DIR, filename);
  fs.writeFileSync(outPath, content, "utf8");
  return outPath;
}

function main() {
  const options = parseExportArgs(process.argv);
  const recipes = loadCocktails();
  const { rows, content, extension } = buildExportPayload(recipes, options);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const suffix = options.all ? "all" : "reviewed";
  const prefix =
    options.format === "notion" ? `cocktail-fichas-notion-${suffix}` : `cocktail-fichas-${suffix}`;
  const outPath = writeExport(content, `${prefix}-${timestamp}.${extension}`);

  console.log(
    `Exportadas ${rows.length} recetas (${options.all ? "all" : "ok|fixed"} de ${recipes.length}) → ${outPath}`,
  );
}

main();
