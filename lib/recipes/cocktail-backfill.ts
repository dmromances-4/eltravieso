import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import type { CocktailRecord } from "@/types/cocktail";
import {
  cocktailIdFromDiffordsId,
  cocktailIdFromSlug,
  extractDiffordsIdFromUrl,
} from "@/lib/diffords/ids";
import { backupCocktailsJson, loadCocktails, saveCocktails } from "@/lib/recipes/cocktails-io";

type CsvRow = Record<string, string>;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeHeader(header: string) {
  const value = header.toLowerCase().trim().replace(/^\ufeff/, "");
  if (value.includes("nombre") || value.includes("título") || value.includes("title")) return "title";
  if (value.includes("enlace") || value.includes("original") || value.includes("url")) return "sourceUrl";
  return value.replace(/\s+/g, "_");
}

async function loadCsvSourceMap(csvPaths: string[]): Promise<Map<string, { sourceUrl: string; diffordsId?: number }>> {
  const map = new Map<string, { sourceUrl: string; diffordsId?: number }>();

  for (const csvPath of csvPaths) {
    if (!fs.existsSync(csvPath)) continue;

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csvParser({ mapHeaders: ({ header }) => normalizeHeader(header) }))
        .on("data", (row: CsvRow) => {
          const title = row.title?.trim();
          const sourceUrl = row.sourceUrl?.trim();
          if (!title || !sourceUrl) return;

          const slug = slugify(title);
          const diffordsId = extractDiffordsIdFromUrl(sourceUrl);
          const entry = { sourceUrl, diffordsId };
          map.set(slug, entry);
          map.set(title.toLowerCase(), entry);

          const urlSlug = sourceUrl.split("/").filter(Boolean).pop();
          if (urlSlug) map.set(urlSlug, entry);
        })
        .on("end", () => resolve())
        .on("error", reject);
    });
  }

  return map;
}

export async function backfillCocktailsFromCsvAsync(csvPath?: string): Promise<{ updated: number; total: number }> {
  const defaultCsvs = [
    path.join(process.cwd(), "Recetas_Solo_Vermut_Rojo_El_Travieso.csv"),
    path.join(process.cwd(), "cocteles_vermut_masivo.csv"),
  ];
  const csvPaths = csvPath ? [csvPath] : defaultCsvs.filter((p) => fs.existsSync(p));

  if (!csvPaths.length) {
    throw new Error("No se encontró ningún CSV con enlaces Difford's.");
  }

  backupCocktailsJson();
  const cocktails = loadCocktails();
  const sourceMap = await loadCsvSourceMap(csvPaths);

  let updated = 0;
  const enriched = cocktails.map((recipe) => {
    const slugKey = slugify(recipe.slug || recipe.title);
    const titleKey = recipe.title.trim().toLowerCase();
    const source = sourceMap.get(slugKey) ?? sourceMap.get(titleKey);

    const diffordsId = source?.diffordsId ?? recipe.diffordsId;
    const sourceUrl = source?.sourceUrl ?? recipe.sourceUrl;
    const id =
      diffordsId != null
        ? cocktailIdFromDiffordsId(diffordsId)
        : recipe.id || cocktailIdFromSlug(slugKey);

    const changed =
      recipe.id !== id ||
      recipe.sourceUrl !== sourceUrl ||
      recipe.diffordsId !== diffordsId ||
      !recipe.reviewStatus;

    if (changed) updated += 1;

    return {
      ...recipe,
      id,
      diffordsId,
      sourceUrl,
      reviewStatus: recipe.reviewStatus ?? "pending",
    } satisfies CocktailRecord;
  });

  saveCocktails(enriched, { skipBackup: true });
  return { updated, total: enriched.length };
}
