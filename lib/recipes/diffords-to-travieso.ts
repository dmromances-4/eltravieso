import type { DiffordsRecipe } from "@/lib/diffords/types";
import type { CocktailRecord } from "@/types/cocktail";
import { applyRuleBasedPolish, type PolishableRecipe } from "@/lib/recipes/polish-recipe";

export function diffordsToPolishable(diffords: DiffordsRecipe): PolishableRecipe {
  return {
    title: diffords.title,
    slug: diffords.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    glass: diffords.glass,
    ingredients: diffords.ingredients,
    method: diffords.method,
    abv: diffords.abv ?? "—",
    kcal: diffords.kcal,
  };
}

export function diffordsToTraviesoRecord(
  diffords: DiffordsRecipe,
  base?: Partial<CocktailRecord>,
): Omit<CocktailRecord, "id"> & { id?: string } {
  const polished = applyRuleBasedPolish(diffordsToPolishable(diffords));
  return {
    id: base?.id,
    diffordsId: diffords.diffordsId ?? base?.diffordsId,
    sourceUrl: diffords.sourceUrl ?? base?.sourceUrl,
    title: polished.title,
    slug: base?.slug ?? polished.slug,
    rating: diffords.rating ?? base?.rating ?? 0,
    glass: polished.glass,
    ingredients: polished.ingredients,
    method: polished.method,
    abv: polished.abv ?? "—",
    kcal: diffords.kcal ?? base?.kcal ?? 0,
    cover: base?.cover ?? "/cocktail-placeholder.svg",
    reviewStatus: base?.reviewStatus,
    reviewedAt: base?.reviewedAt,
    reviewNotes: base?.reviewNotes,
  };
}
