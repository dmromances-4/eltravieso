import type { CocktailRecord } from "@/types/cocktail";
import { fetchDiffordsRecipe } from "@/lib/diffords/fetch-recipe";
import { compareRecipes } from "@/lib/recipes/compare-recipes";
import { diffordsToTraviesoRecord } from "@/lib/recipes/diffords-to-travieso";

export type AuditRecipeResult = {
  local: CocktailRecord;
  diffordsRaw: Awaited<ReturnType<typeof fetchDiffordsRecipe>> | null;
  comparison: ReturnType<typeof compareRecipes> | null;
  error?: string;
};

export async function auditRecipe(
  recipe: CocktailRecord,
  options?: { forceFetch?: boolean },
): Promise<AuditRecipeResult> {
  if (!recipe.sourceUrl) {
    return {
      local: recipe,
      diffordsRaw: null,
      comparison: null,
      error: "Sin sourceUrl de Difford's",
    };
  }

  try {
    const diffordsRaw = await fetchDiffordsRecipe(recipe.sourceUrl, {
      forceFetch: options?.forceFetch,
    });
    const comparison = compareRecipes(recipe, diffordsRaw);
    return { local: recipe, diffordsRaw, comparison };
  } catch (error) {
    return {
      local: recipe,
      diffordsRaw: null,
      comparison: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function applyDiffordsToRecipe(
  recipe: CocktailRecord,
  diffordsRaw: NonNullable<AuditRecipeResult["diffordsRaw"]>,
  notes?: string,
): CocktailRecord {
  const merged = diffordsToTraviesoRecord(diffordsRaw, recipe);
  return {
    ...recipe,
    ...merged,
    id: recipe.id,
    slug: recipe.slug,
    reviewStatus: "fixed",
    reviewedAt: new Date().toISOString(),
    reviewNotes: notes ?? "Aplicada versión Difford's normalizada",
  };
}

export function markRecipeReviewed(
  recipe: CocktailRecord,
  status: CocktailRecord["reviewStatus"],
  notes?: string,
): CocktailRecord {
  return {
    ...recipe,
    reviewStatus: status,
    reviewedAt: new Date().toISOString(),
    reviewNotes: notes,
  };
}
