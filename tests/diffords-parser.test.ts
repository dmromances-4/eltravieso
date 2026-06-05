import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { parseDiffordsRecipePage } from "@/lib/diffords/parse-recipe-page";

describe("parseDiffordsRecipePage", () => {
  it("parses sweet martini fixture", () => {
    const html = fs.readFileSync(
      path.join(process.cwd(), "tests/fixtures/diffords/sweet-martini.html"),
      "utf8",
    );
    const recipe = parseDiffordsRecipePage(
      html,
      "https://www.diffordsguide.com/cocktails/recipe/2887/sweet-martini",
    );

    expect(recipe.title).toBe("Sweet Martini");
    expect(recipe.diffordsId).toBe(2887);
    expect(recipe.ingredients.length).toBeGreaterThanOrEqual(2);
    expect(recipe.ingredients.some((i) => /gin/i.test(i))).toBe(true);
    expect(recipe.method.toLowerCase()).toContain("stir");
    expect(recipe.kcal).toBe(188);
    expect(recipe.rating).toBe(40);
    expect(recipe.glass.toLowerCase()).toContain("martini");
  });
});
