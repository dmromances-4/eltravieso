import { describe, expect, it } from "vitest";
import {
  buildRecipeImagePrompt,
  buildRecipeImagePromptFromReference,
  inferGarnish,
  inferLiquidTone,
} from "@/lib/recipes/image-prompt";

describe("recipe-image-prompt", () => {
  const input = {
    title: "Negroni",
    glass: "Copa old fashioned",
    ingredients: ["30 ml Vermut rojo El Travieso", "30 ml gin", "30 ml Campari", "1 rodaja de naranja"],
    method: "Stir all ingredients with ice and strain.",
  };

  it("includes brand and composition hints", () => {
    const prompt = buildRecipeImagePrompt(input);
    expect(prompt).toContain("Negroni");
    expect(prompt).toContain("El Travieso");
    expect(prompt).toContain("85mm");
    expect(prompt).toContain("4:5");
  });

  it("infers liquid tone and garnish from ingredients", () => {
    expect(inferLiquidTone(input.ingredients)).toMatch(/vermouth|gin|aperitif/i);
    expect(inferGarnish(input.ingredients)).toMatch(/orange/i);
  });

  it("merges reference description with recipe specifics", () => {
    const prompt = buildRecipeImagePromptFromReference(input, "Amber-red liquid, large ice cube, orange peel.");
    expect(prompt).toContain("Amber-red liquid");
    expect(prompt).toContain("Negroni");
    expect(prompt).toContain("do not copy branding");
  });
});
