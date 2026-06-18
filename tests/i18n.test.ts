import { describe, expect, it } from "vitest";
import { mergeLocalizedFields } from "@/lib/i18n/content";
import { withLocalePrefix, stripLocalePrefix } from "@/lib/i18n/locale";
import { getCocktailBySlug } from "@/lib/recipes/cocktails-io";

describe("i18n locale helpers", () => {
  it("prefixes non-default locale only", () => {
    expect(withLocalePrefix("/recetas", "es")).toBe("/recetas");
    expect(withLocalePrefix("/recetas", "en")).toBe("/en/recetas");
    expect(withLocalePrefix("/", "en")).toBe("/en");
  });

  it("strips locale prefix for admin checks", () => {
    expect(stripLocalePrefix("/en/admin/products")).toBe("/admin/products");
    expect(stripLocalePrefix("/admin")).toBe("/admin");
  });
});

describe("localized cocktail sidecars", () => {
  it("merges EN glass copy for sweet-martini", () => {
    const base = { slug: "sweet-martini", glass: "Copa de martini", title: "Sweet Martini" };
    const merged = mergeLocalizedFields(base, "en", "cocktails");
    expect(merged.glass).toBe("Martini glass");
  });

  it("loads localized cocktail from catalog io", () => {
    const recipe = getCocktailBySlug("sweet-martini", "en");
    expect(recipe?.glass).toBe("Martini glass");
  });
});
