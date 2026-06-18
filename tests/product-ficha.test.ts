import { describe, expect, it } from "vitest";
import { normalizeMatchText } from "@/lib/recipes/match-products";

describe("product ficha shop filters", () => {
  it("hides ingrediente stub when real product shares match term", () => {
    const realProducts = [
      { slug: "campari", title: "Campari" },
      { slug: "vermut-rojo", title: "Vermut Rojo El Travieso" },
    ];

    const realMatchTerms = new Set(
      realProducts.flatMap((p) => [
        normalizeMatchText(p.slug),
        normalizeMatchText(p.title),
      ]),
    );

    const candidates = [
      { slug: "ingrediente-campari", title: "Campari" },
      { slug: "ingrediente-gin", title: "Gin" },
    ];

    const visible = candidates.filter((p) => {
      const key = normalizeMatchText(p.slug.replace(/^ingrediente-/, ""));
      return !realMatchTerms.has(key);
    });

    expect(visible).toHaveLength(1);
    expect(visible[0].slug).toBe("ingrediente-gin");
  });
});
