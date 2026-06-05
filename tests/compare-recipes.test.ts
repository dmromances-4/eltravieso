import { describe, expect, it } from "vitest";
import { compareRecipes } from "@/lib/recipes/compare-recipes";
import type { CocktailRecord } from "@/types/cocktail";
import type { DiffordsRecipe } from "@/lib/diffords/types";

const localBroken: CocktailRecord = {
  id: "dg-35966",
  diffordsId: 35966,
  sourceUrl: "https://www.diffordsguide.com/cocktails/recipe/35966/vermouth-soda",
  title: "Vermouth & Soda",
  slug: "vermouth-soda",
  rating: 12,
  glass: "Vaso Vaso Vaso old fashioned",
  ingredients: ["60 ml Vermut rojo El Travieso", "60 ml Thomas Henry Agua con gas"],
  method: "POUR all ingredients into ice-filled glass.",
  abv: "—",
  kcal: 92,
  cover: "/cocktail-placeholder.svg",
};

const diffords: DiffordsRecipe = {
  diffordsId: 35966,
  sourceUrl: localBroken.sourceUrl!,
  title: "Vermouth & Soda",
  glass: "Serve in a Old-Fashioned glass",
  ingredients: [
    "60 ml Strucchi Rosso Vermouth chilled",
    "60 ml Thomas Henry Soda Water chilled",
  ],
  method: "POUR all ingredients into ice-filled glass.\nGarnish with orange slice skewered with olive.",
  kcal: 92,
  rating: 12,
};

describe("compareRecipes", () => {
  it("flags untranslated method and glass mismatch", () => {
    const result = compareRecipes(localBroken, diffords);
    expect(result.issues).toContain("method_untranslated");
    expect(result.score).toBeLessThan(90);
  });
});
