import { describe, expect, it } from "vitest";
import {
  filterForExport,
  toCsv,
  toFichaExport,
  toNotionExport,
} from "@/lib/recipes/export-cocktail-fichas";
import type { CocktailRecord } from "@/types/cocktail";

const sample: CocktailRecord[] = [
  {
    id: "dg-1",
    title: "Sweet Martini",
    slug: "sweet-martini",
    rating: 40,
    glass: "Copa de martini",
    ingredients: ["75 ml Ginebra", "15 ml Vermut"],
    method: "1. Enfría la copa.\n2. Remueve y cuela.",
    abv: "—",
    kcal: 188,
    cover: "/cocktail-placeholder.svg",
    reviewStatus: "ok",
  },
  {
    id: "dg-2",
    title: "Pending Drink",
    slug: "pending-drink",
    rating: 5,
    glass: "Highball",
    ingredients: ["50 ml Rum"],
    method: "Build in glass.",
    abv: "10%",
    kcal: 100,
    cover: "/cocktail-placeholder.svg",
    reviewStatus: "pending",
  },
  {
    id: "dg-3",
    title: "Fixed Sour",
    slug: "fixed-sour",
    rating: 8,
    glass: "Rocks",
    ingredients: ["60 ml Whiskey"],
    method: "Shake and strain.",
    abv: "20%",
    kcal: 150,
    cover: "/cocktail-placeholder.svg",
    reviewStatus: "fixed",
  },
];

describe("export-cocktail-fichas", () => {
  it("filters ok and fixed by default", () => {
    const filtered = filterForExport(sample);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((r) => r.slug)).toEqual(["sweet-martini", "fixed-sour"]);
  });

  it("includes all with --all", () => {
    expect(filterForExport(sample, { all: true })).toHaveLength(3);
  });

  it("respects limit", () => {
    expect(filterForExport(sample, { limit: 1 })).toHaveLength(1);
  });

  it("builds web URL from base", () => {
    const row = toFichaExport(sample[0], "https://eltravieso.test");
    expect(row.webUrl).toBe("https://eltravieso.test/recetas/sweet-martini");
    expect(row.methodSteps).toEqual(["1. Enfría la copa.", "2. Remueve y cuela."]);
  });

  it("exports CSV with headers", () => {
    const rows = filterForExport(sample).map((r) => toFichaExport(r, "http://localhost:3000"));
    const csv = toCsv(rows);
    expect(csv.split("\n")[0]).toContain("title,slug");
    expect(csv).toContain("sweet-martini");
  });

  it("maps notion properties", () => {
    const row = toFichaExport(sample[0], "http://localhost:3000");
    const notion = toNotionExport([row])[0];
    expect(notion.notionProperties.Nombre).toBe("Sweet Martini");
    expect(notion.notionProperties.Preparación).toContain("1. Enfría la copa.");
    expect(notion.notionProperties.Preparación).not.toContain("1. 1.");
  });

  it("does not duplicate step numbers in notion preparation", () => {
    const numbered = toFichaExport(sample[0], "http://localhost:3000");
    const plain = toFichaExport(sample[2], "http://localhost:3000");
    const [numberedRow, plainRow] = toNotionExport([numbered, plain]);
    expect(numberedRow.notionProperties.Preparación).toBe(
      "1. Enfría la copa.\n2. Remueve y cuela.",
    );
    expect(plainRow.notionProperties.Preparación).toBe("1. Shake and strain.");
  });
});
