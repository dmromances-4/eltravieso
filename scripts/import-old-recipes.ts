import fs from "fs";
import path from "path";
import XLSX from "xlsx";

type OldRecipe = {
  title?: string;
  name?: string;
  nombre?: string;
  slug?: string;
  rating?: number;
  glass?: string;
  vaso?: string;
  ingredients?: string[] | string;
  ingredientes?: string[] | string;
  method?: string;
  preparacion?: string;
  método?: string;
  abv?: string | number;
  kcal?: number;
  cover?: string;
};

type CocktailRecord = {
  title: string;
  slug: string;
  rating: number;
  glass: string;
  ingredients: string[];
  method: string;
  abv: string;
  kcal: number;
  cover: string;
};

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

// Descarta titulos vacios o placeholder (basura de importaciones antiguas).
function isValidTitle(title: string | undefined | null): boolean {
  const t = (title ?? "").trim();
  if (t.length < 2) return false;
  if (/sin t[ií]tulo/i.test(t)) return false;
  if (/^receta\s*\d*$/i.test(t)) return false;
  if (/^c[óo]ctel sin/i.test(t)) return false;
  return true;
}

function cleanIngredient(value: string): string {
  return value
    .replace(/^[\s\-\u2013\u2022*]+/, "") // guiones/bullets iniciales
    .trim();
}

function parseIngredients(value: any): string[] {
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
    }) as any[][];

    if (data.length < 2) return [];

    const headers = (data[0] as string[]).map(normalizeHeader);
    const records: CocktailRecord[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const record: any = {};
      headers.forEach((header, idx) => {
        record[header] = row[idx];
      });

      const title = String(record.title || record.name || record.nombre || "").trim();
      if (!isValidTitle(title)) continue; // saltar filas sin titulo real
      const slug = slugify(record.slug || title);
      if (!slug) continue;

      records.push({
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

async function importOldRecipes() {
  const recipesDir = path.resolve(process.cwd(), "Recetas");
  const dataDir = path.resolve(process.cwd(), "data");
  const outputPath = path.join(dataDir, "cocktails.json");

  // Load existing cocktails (fuente unica acumulada), descartando basura previa.
  let existing: CocktailRecord[] = [];
  try {
    const existing_data = fs.readFileSync(outputPath, "utf-8");
    existing = (JSON.parse(existing_data) as CocktailRecord[]).filter((r) => isValidTitle(r.title));
  } catch {
    console.log("No existing cocktails.json found, starting fresh.");
  }

  const allRecipes: CocktailRecord[] = [...existing];
  const seenSlugs = new Set(allRecipes.map((r) => r.slug));

  // Reunir TODAS las fuentes: Recetas/*.xlsx + Recetas/*.csv + CSV(s) en la raiz.
  const sourceFiles: string[] = [];

  if (fs.existsSync(recipesDir)) {
    for (const f of fs.readdirSync(recipesDir)) {
      if (f.endsWith(".xlsx") || f.endsWith(".csv")) {
        sourceFiles.push(path.join(recipesDir, f));
      }
    }
  }

  // CSVs de recetas en la raiz del proyecto.
  for (const f of fs.readdirSync(process.cwd())) {
    if (/recet/i.test(f) && f.endsWith(".csv")) {
      sourceFiles.push(path.resolve(process.cwd(), f));
    }
  }

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  let added = 0;
  for (const file of sourceFiles) {
    console.log(`Importing ${path.basename(file)}...`);
    const imported = await importXLSX(file); // XLSX.readFile tambien lee .csv
    for (const recipe of imported) {
      if (recipe.slug && !seenSlugs.has(recipe.slug)) {
        allRecipes.push(recipe);
        seenSlugs.add(recipe.slug);
        added++;
      }
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(allRecipes, null, 2), "utf-8");
  console.log(`✓ Recetas centralizadas. Nuevas: ${added}. Total: ${allRecipes.length}`);
}

importOldRecipes().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
