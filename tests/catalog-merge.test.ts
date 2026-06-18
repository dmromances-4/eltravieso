import { describe, expect, it } from "vitest";
import {
  mergeProductsBySlug,
  mergeRecipesBySlug,
  normalizeCocktailsFile,
} from "@/lib/catalog/merge";
import type { NormalizedProduct } from "@/scripts/build-products";
import type { CocktailRecord } from "@/types/cocktail";

describe("catalog merge", () => {
  it("mergeProductsBySlug insert-only no sobrescribe", () => {
    const existing: NormalizedProduct[] = [
      {
        title: "Vermut A",
        slug: "vermut-a",
        description: "original",
        category: "VERMUT",
        priceCents: 1000,
        imageUrl: null,
        sourceUrl: null,
        format: "UNIT",
        volumeMl: null,
      },
    ];
    const incoming: NormalizedProduct[] = [
      {
        title: "Vermut A actualizado",
        slug: "vermut-a",
        description: "nuevo",
        category: "VERMUT",
        priceCents: 2000,
        imageUrl: null,
        sourceUrl: null,
        format: "UNIT",
        volumeMl: null,
      },
      {
        title: "Gin B",
        slug: "gin-b",
        description: null,
        category: "ALCOHOL",
        priceCents: 1500,
        imageUrl: null,
        sourceUrl: null,
        format: "UNIT",
        volumeMl: null,
      },
    ];

    const { merged, added, skipped } = mergeProductsBySlug(existing, incoming, { mode: "insert-only" });
    expect(added).toBe(1);
    expect(skipped).toBe(1);
    expect(merged).toHaveLength(2);
    expect(merged.find((p) => p.slug === "vermut-a")?.description).toBe("original");
  });

  it("normalizeCocktailsFile asigna dg-* y deduplica por id/slug", () => {
    const records: CocktailRecord[] = [
      {
        id: "",
        diffordsId: 2887,
        title: "Negroni",
        slug: "negroni",
        rating: 4,
        glass: "Copa",
        ingredients: ["Gin"],
        method: "Stir",
        abv: "24",
        kcal: 200,
        cover: "/cocktail-placeholder.svg",
      },
      {
        id: "slug-negroni",
        title: "Negroni duplicado",
        slug: "negroni",
        rating: 4,
        glass: "Copa",
        ingredients: ["Gin"],
        method: "Stir",
        abv: "24",
        kcal: 200,
        cover: "/cocktail-placeholder.svg",
      },
      {
        id: "",
        title: "Sin título",
        slug: "sin-titulo",
        rating: 0,
        glass: "Copa",
        ingredients: [],
        method: "",
        abv: "",
        kcal: 0,
        cover: "/cocktail-placeholder.svg",
      },
    ];

    const { normalized, skipped } = normalizeCocktailsFile(records);
    expect(normalized).toHaveLength(1);
    expect(normalized[0].id).toBe("dg-2887");
    expect(skipped).toBeGreaterThanOrEqual(2);
  });

  it("mergeRecipesBySlug añade solo slugs nuevos", () => {
    const existing: CocktailRecord[] = [
      {
        id: "slug-old",
        title: "Old Fashioned",
        slug: "old-fashioned",
        rating: 5,
        glass: "Copa",
        ingredients: ["Bourbon"],
        method: "Stir",
        abv: "30",
        kcal: 180,
        cover: "/cocktail-placeholder.svg",
      },
    ];
    const incoming: CocktailRecord[] = [
      {
        id: "slug-old-fashioned",
        title: "Old Fashioned",
        slug: "old-fashioned",
        rating: 5,
        glass: "Copa",
        ingredients: ["Bourbon"],
        method: "Stir",
        abv: "30",
        kcal: 180,
        cover: "/cocktail-placeholder.svg",
      },
      {
        id: "slug-martini",
        title: "Martini",
        slug: "martini",
        rating: 4,
        glass: "Copa",
        ingredients: ["Gin"],
        method: "Stir",
        abv: "28",
        kcal: 160,
        cover: "/cocktail-placeholder.svg",
      },
    ];

    const { merged, added, skipped } = mergeRecipesBySlug(existing, incoming);
    expect(added).toBe(1);
    expect(skipped).toBe(1);
    expect(merged).toHaveLength(2);
  });
});
