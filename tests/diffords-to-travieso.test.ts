import { describe, expect, it } from "vitest";
import { diffordsToTraviesoRecord } from "@/lib/recipes/diffords-to-travieso";
import type { DiffordsRecipe } from "@/lib/diffords/types";

describe("diffordsToTraviesoRecord", () => {
  it("replaces Strucchi and normalizes glass", () => {
    const diffords: DiffordsRecipe = {
      sourceUrl: "https://www.diffordsguide.com/cocktails/recipe/2887/sweet-martini",
      diffordsId: 2887,
      title: "Sweet Martini",
      glass: "Serve in a Martini glass",
      ingredients: ["75 ml Hayman's London Dry Gin", "15 ml Strucchi Rosso Vermouth"],
      method: "STIR all ingredients with ice.\nFINE STRAIN into chilled glass.",
      kcal: 188,
    };

    const record = diffordsToTraviesoRecord(diffords);
    expect(record.glass).toBe("Copa de martini");
    expect(record.ingredients.some((i) => i.includes("Vermut rojo El Travieso"))).toBe(true);
    expect(record.method).not.toMatch(/^STIR/m);
    expect(record.method.split("\n").length).toBeGreaterThan(2);
  });
});
