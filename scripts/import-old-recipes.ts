import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import type { SyncPhaseResult } from "@/lib/catalog/sync-report";
import { isValidRecipeTitle, mergeRecipesBySlug } from "@/lib/catalog/merge";
import { COCKTAILS_PATH } from "@/lib/recipes/cocktails-io";
import type { CocktailRecord } from "@/types/cocktail";

function normalizeHeader(header: string): string {
  const lower = header.toLowerCase().trim();
  if (lower.includes("título") || lower.includes("title") || lower.includes("nombre")) return "title";
  if (lower.includes("slug")) return "slug";
  if (lower.includes("puntuación") || lower.includes("rating") || lower.includes("score")) return "rating";
  if (lower.includes("cristal") || lower.includes("vaso") || lower.includes("glass")) return "glass";
  if (lower.includes("ingredientes") || lower.includes("ingredients")) return "ingredients";
  if (lower.includes("método") || lower.includes("method") || lower.includes("preparación")) return "method";
  if (lower.includes("abv") || lower.includes("alcohólico")) return "abv";
  if (lower.includes("kcal") || lower.includes("calorías")) return "kcal";
  return lower.replace(/\s+/g, "_");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanIngredient(value: string): string {
  return value.replace(/^[\s\-\u2013\u2022*]+/, "").trim();
}

function parseIngredients(value: unknown): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw
    .flatMap((v) => String(v).split(/\r?\n|;|\|\|/))
    .map(cleanIngredient)
    .filter(Boolean);
}

async function importXLSX(filePath: string): Promise<CocktailRecord[]> {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    }) as unknown[][];

    if (data.length < 2) return [];

    const headers = (data[0] as string[]).map(normalizeHeader);
    const records: CocktailRecord[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const record: Record<string, unknown> = {};
      headers.forEach((header, idx) => {
        record[header] = row[idx];
      });

      const title = String(record.title || record.name || record.nombre || "").trim();
      if (!isValidRecipeTitle(title)) continue;
      const slug = slugify(String(record.slug || title));
      if (!slug) continue;

      records.push({
        id: `slug-${slug}`,
        title,
        slug,
        rating: Number(String(record.rating || "0").replace(/[^0-9.]/g, "")) || 0,
        glass: String(record.glass || record.vaso || "Copa de cóctel").trim(),
        ingredients: parseIngredients(record.ingredients || record.ingredientes),
        method: String(record.method || record.preparación || record.método || "Mezclar y servir.").trim(),
        abv: String(record.abv || "—").trim(),
        kcal: Number(String(record.kcal || "0").replace(/[^0-9.]/g, "")) || 0,
        cover: "/cocktail-placeholder.svg",
      });
    }

    return records;
  } catch (err) {
    console.error(`Error importing ${filePath}:`, err);
    return [];
  }
}

function collectSourceFiles(): string[] {
  const recipesDir = path.resolve(process.cwd(), "Recetas");
  const sourceFiles: string[] = [];

  if (fs.existsSync(recipesDir)) {
    for (const f of fs.readdirSync(recipesDir)) {
      if (f.endsWith(".xlsx") || f.endsWith(".csv")) {
        sourceFiles.push(path.join(recipesDir, f));
      }
    }
  }

  for (const f of fs.readdirSync(process.cwd())) {
    if (/recet/i.test(f) && f.endsWith(".csv")) {
      sourceFiles.push(path.resolve(process.cwd(), f));
    }
  }

  return sourceFiles;
}

function loadExistingCocktails(outputPath: string): CocktailRecord[] {
  try {
    const existing_data = fs.readFileSync(outputPath, "utf-8");
    return (JSON.parse(existing_data) as CocktailRecord[]).filter((r) => isValidRecipeTitle(r.title));
  } catch {
    return [];
  }
}

export type ImportOldRecipesOptions = {
  dryRun?: boolean;
  outputPath?: string;
};

export async function importOldRecipes(options: ImportOldRecipesOptions = {}): Promise<{
  phase: SyncPhaseResult;
  recipes: CocktailRecord[];
}> {
  const outputPath = options.outputPath ?? COCKTAILS_PATH;
  const dataDir = path.dirname(outputPath);
  const existing = loadExistingCocktails(outputPath);
  const sourceFiles = collectSourceFiles();

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const imported: CocktailRecord[] = [];
  for (const file of sourceFiles) {
    console.log(`Importing ${path.basename(file)}...`);
    imported.push(...(await importXLSX(file)));
  }

  const { merged, added, skipped } = mergeRecipesBySlug(existing, imported);

  if (!options.dryRun) {
    fs.writeFileSync(outputPath, `${JSON.stringify(merged, null, 2)}\n`, "utf-8");
  }

  console.log(`✓ Recetas centralizadas. Nuevas: ${added}. Total: ${merged.length}`);
  return {
    phase: { added, skipped, total: merged.length, errors: 0 },
    recipes: merged,
  };
}

import { pathToFileURL } from "url";

const isDirectRun = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isDirectRun) {
  importOldRecipes().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}
