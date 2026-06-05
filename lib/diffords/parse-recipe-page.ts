import type { DiffordsRecipe } from "@/lib/diffords/types";
import { extractDiffordsIdFromUrl } from "@/lib/diffords/ids";

type JsonLdRecipe = {
  name?: string;
  recipeIngredient?: string[];
  recipeInstructions?: Array<{ text?: string; name?: string } | string>;
  nutrition?: { calories?: string };
  aggregateRating?: { ratingCount?: number | string };
  url?: string;
};

function parseJsonLd(html: string): JsonLdRecipe | null {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1].trim()) as JsonLdRecipe | JsonLdRecipe[];
      const recipe = Array.isArray(parsed)
        ? parsed.find((item) => item && typeof item === "object" && "recipeIngredient" in item)
        : parsed;
      if (recipe?.recipeIngredient?.length) return recipe;
    } catch {
      /* try next block */
    }
  }
  return null;
}

function parseGlassFromHtml(html: string): string {
  const serveMatch = html.match(/Serve in (?:a|an)\s*<a[^>]*>([^<]+)<\/a>/i);
  if (serveMatch) return `Serve in a ${serveMatch[1].trim()}`;

  const plainMatch = html.match(/Serve in (?:a|an)\s+([^<.\n]+)/i);
  if (plainMatch) return `Serve in a ${plainMatch[1].trim()}`;

  return "";
}

function parseIngredientsTable(html: string): string[] {
  const rows = [...html.matchAll(
    /<tr>\s*<td>([^<]+)<\/td>\s*<td[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi,
  )];
  if (!rows.length) return [];

  return rows.map((row) => {
    const amount = row[1].trim();
    const name = row[2].trim().replace(/\s+/g, " ");
    return `${amount} ${name}`;
  });
}

function parseDiscerningRating(html: string): number | undefined {
  const match = html.match(/Discerning Drinkers\s*\((\d+)\s*ratings?\)/i);
  if (!match) return undefined;
  return Number(match[1]) || undefined;
}

function instructionsToMethod(
  instructions: JsonLdRecipe["recipeInstructions"],
): string {
  if (!instructions?.length) return "";
  return instructions
    .map((step) => {
      if (typeof step === "string") return step.trim();
      return String(step.text ?? step.name ?? "").trim();
    })
    .filter(Boolean)
    .join("\n");
}

function parseKcal(calories?: string): number | undefined {
  if (!calories) return undefined;
  const match = calories.match(/(\d+)/);
  return match ? Number(match[1]) : undefined;
}

export function parseDiffordsRecipePage(html: string, sourceUrl: string): DiffordsRecipe {
  const jsonLd = parseJsonLd(html);
  const diffordsId = extractDiffordsIdFromUrl(sourceUrl);

  const tableIngredients = parseIngredientsTable(html);
  const jsonIngredients = jsonLd?.recipeIngredient?.map((line) => line.trim()).filter(Boolean) ?? [];
  const ingredients = tableIngredients.length >= jsonIngredients.length ? tableIngredients : jsonIngredients;

  const method = instructionsToMethod(jsonLd?.recipeInstructions);
  const glass = parseGlassFromHtml(html) || "Copa de cóctel";
  const title = jsonLd?.name?.trim() || "Cóctel sin título";
  const kcal = parseKcal(jsonLd?.nutrition?.calories);
  const rating =
    parseDiscerningRating(html) ??
    (jsonLd?.aggregateRating?.ratingCount != null
      ? Number(jsonLd.aggregateRating.ratingCount)
      : undefined);

  return {
    diffordsId,
    sourceUrl: jsonLd?.url?.trim() || sourceUrl,
    title,
    glass,
    ingredients,
    method,
    kcal,
    rating,
    abv: "—",
  };
}
