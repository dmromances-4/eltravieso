import type { NormalizedProduct } from "@/scripts/build-products";
import { normalizeLegacyRecord } from "@/lib/recipes/cocktails-io";
import type { CocktailRecord } from "@/types/cocktail";
import type { SyncPhaseResult } from "@/lib/catalog/sync-report";

export function isValidRecipeTitle(title: string | undefined | null): boolean {
  const t = (title ?? "").trim();
  if (t.length < 2) return false;
  if (/sin t[ií]tulo/i.test(t)) return false;
  if (/^receta\s*\d*$/i.test(t)) return false;
  if (/^c[óo]ctel sin/i.test(t)) return false;
  return true;
}

export function mergeProductsBySlug(
  existing: NormalizedProduct[],
  incoming: NormalizedProduct[],
  options: { mode: "insert-only" } = { mode: "insert-only" },
): { merged: NormalizedProduct[]; added: number; skipped: number } {
  const bySlug = new Map(existing.map((p) => [p.slug, p]));
  let added = 0;
  let skipped = 0;

  for (const product of incoming) {
    if (!product.slug) {
      skipped += 1;
      continue;
    }
    if (bySlug.has(product.slug)) {
      skipped += 1;
      if (options.mode !== "insert-only") {
        bySlug.set(product.slug, { ...bySlug.get(product.slug)!, ...product });
      }
      continue;
    }
    bySlug.set(product.slug, product);
    added += 1;
  }

  return { merged: [...bySlug.values()], added, skipped };
}

export function mergeProductsResult(
  merged: NormalizedProduct[],
  added: number,
  skipped: number,
  errors = 0,
): SyncPhaseResult {
  return { added, skipped, total: merged.length, errors };
}

export function normalizeCocktailsFile(records: CocktailRecord[]): {
  normalized: CocktailRecord[];
  added: number;
  skipped: number;
} {
  const valid = records.filter((r) => isValidRecipeTitle(r.title));
  const skippedInvalid = records.length - valid.length;

  const byId = new Map<string, CocktailRecord>();
  const bySlug = new Map<string, CocktailRecord>();
  let mergedDuplicates = 0;

  for (const raw of valid) {
    const recipe = normalizeLegacyRecord(raw);
    if (byId.has(recipe.id)) {
      mergedDuplicates += 1;
      continue;
    }
    if (bySlug.has(recipe.slug)) {
      mergedDuplicates += 1;
      continue;
    }
    byId.set(recipe.id, recipe);
    bySlug.set(recipe.slug, recipe);
  }

  const normalized = [...byId.values()];
  return {
    normalized,
    added: 0,
    skipped: skippedInvalid + mergedDuplicates,
  };
}

export function mergeRecipesBySlug(
  existing: CocktailRecord[],
  incoming: CocktailRecord[],
): { merged: CocktailRecord[]; added: number; skipped: number } {
  const bySlug = new Map(existing.map((r) => [r.slug, r]));
  let added = 0;
  let skipped = 0;

  for (const recipe of incoming) {
    if (!recipe.slug || !isValidRecipeTitle(recipe.title)) {
      skipped += 1;
      continue;
    }
    if (bySlug.has(recipe.slug)) {
      skipped += 1;
      continue;
    }
    bySlug.set(recipe.slug, recipe);
    added += 1;
  }

  return { merged: [...bySlug.values()], added, skipped };
}
