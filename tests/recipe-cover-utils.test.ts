import { describe, expect, it } from "vitest";
import { spiritKeywordsFromIngredients, scoreCoverCandidate } from "@/lib/recipes/cover-reference";
import { isPhotoCover, shouldRegenerateCover } from "@/lib/recipes/cover-utils";

describe("cover-utils", () => {
  it("treats SVG as non-photo", () => {
    expect(isPhotoCover("/uploads/recipe-covers/adonis.svg")).toBe(false);
    expect(isPhotoCover("/uploads/recipe-covers/americano.jpg")).toBe(true);
  });

  it("shouldRegenerateCover skips photos unless force", () => {
    expect(shouldRegenerateCover("/uploads/recipe-covers/americano.jpg")).toBe(false);
    expect(shouldRegenerateCover("/uploads/recipe-covers/adonis.svg")).toBe(true);
    expect(shouldRegenerateCover("/uploads/recipe-covers/americano.jpg", true)).toBe(true);
  });
});

describe("cover-reference scoring", () => {
  it("extracts spirit keywords from ingredients", () => {
    const spirits = spiritKeywordsFromIngredients(["30 ml gin", "30 ml Campari"]);
    expect(spirits).toContain("gin");
    expect(spirits).toContain("vermouth");
  });

  it("boosts cocktail photos over wine", () => {
    const input = {
      title: "Negroni",
      glass: "Copa old fashioned",
      ingredients: ["gin", "Campari", "vermouth"],
    };
    const cocktail = scoreCoverCandidate(
      {
        url: "https://example.com/1.jpg",
        source: "pexels",
        license: "free_stock",
        alt: "red cocktail drink bar mixology",
        width: 867,
        height: 1300,
      },
      input,
    );
    const wine = scoreCoverCandidate(
      {
        url: "https://example.com/2.jpg",
        source: "pexels",
        license: "free_stock",
        alt: "glass of red wine",
        width: 867,
        height: 1300,
      },
      input,
    );
    expect(cocktail).toBeGreaterThan(wine);
  });
});
