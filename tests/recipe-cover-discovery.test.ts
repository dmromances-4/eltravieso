import { describe, expect, it } from "vitest";
import {
  buildCoverSearchQueries,
  extractOgImageFromHtml,
  titleMatchScore,
} from "@/lib/recipes/cover-discovery";

describe("cover-discovery", () => {
  it("extracts og:image from HTML", () => {
    const html = `<html><head><meta property="og:image" content="https://cdn.example.com/negroni.jpg" /></head></html>`;
    expect(extractOgImageFromHtml(html)).toBe("https://cdn.example.com/negroni.jpg");
  });

  it("builds search queries from recipe input", () => {
    const queries = buildCoverSearchQueries({
      title: "Negroni",
      glass: "Copa old fashioned",
      ingredients: ["30 ml Vermut rojo El Travieso", "30 ml gin", "30 ml Campari"],
    });
    expect(queries[0]).toContain("Negroni");
    expect(queries.some((q) => q.includes("gin"))).toBe(true);
  });

  it("scores title token overlap", () => {
    expect(titleMatchScore("Sweet Martini", "sweet martini cocktail photography")).toBeGreaterThan(0.5);
    expect(titleMatchScore("Negroni", "margarita on beach")).toBeLessThan(0.3);
  });
});
