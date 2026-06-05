import type { CocktailRecord } from "@/types/cocktail";
import type { DiffordsRecipe } from "@/lib/diffords/types";
import { diffordsToTraviesoRecord } from "@/lib/recipes/diffords-to-travieso";

export type CompareIssue =
  | "method_untranslated"
  | "glass_mismatch"
  | "ingredient_count"
  | "ingredient_amount_mismatch"
  | "kcal_mismatch"
  | "missing_source_url";

export type RecipeComparison = {
  score: number;
  issues: CompareIssue[];
  details: string[];
  expected: Pick<CocktailRecord, "title" | "glass" | "ingredients" | "method" | "kcal" | "rating">;
};

type ParsedIngredient = {
  amount: number;
  unit: string;
  name: string;
  raw: string;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseIngredientLine(line: string): ParsedIngredient | null {
  const cleaned = line.trim();
  const match = cleaned.match(/^([\d.,/]+)\s*(ml|cl|oz|dash|dashes|drop|drops|gotas?|cucharada|slice|rodaja|parte|partes)\.?\s+(.+)$/i);
  if (!match) {
    return { amount: 0, unit: "", name: normalizeText(cleaned), raw: cleaned };
  }
  const amount = Number(match[1].replace(",", "."));
  return {
    amount: Number.isFinite(amount) ? amount : 0,
    unit: match[2].toLowerCase(),
    name: normalizeText(match[3]),
    raw: cleaned,
  };
}

function methodLooksEnglish(method: string): boolean {
  return (
    /^(STIR|SHAKE|POUR|BUILD|COMBINE|SELECT|DRY SHAKE)/im.test(method) ||
    /\b(all ingredients|chilled glass|fine strain|ice-filled)\b/i.test(method)
  );
}

function glassKey(glass: string): string {
  const n = normalizeText(glass);
  if (n.includes("old fashioned")) return "old-fashioned";
  if (n.includes("martini")) return "martini";
  if (n.includes("coupe")) return "coupe";
  if (n.includes("highball")) return "highball";
  if (n.includes("collins")) return "collins";
  if (n.includes("flute")) return "flute";
  if (n.includes("toddy")) return "toddy";
  return n.replace(/^(vaso|copa)\s+/g, "").slice(0, 24);
}

function compareIngredients(local: string[], expected: string[]): { issues: CompareIssue[]; details: string[] } {
  const issues: CompareIssue[] = [];
  const details: string[] = [];

  if (local.length !== expected.length) {
    issues.push("ingredient_count");
    details.push(`Ingredientes: local ${local.length} vs esperado ${expected.length}`);
  }

  const localParsed = local.map(parseIngredientLine);
  const expectedParsed = expected.map(parseIngredientLine);

  for (let i = 0; i < Math.min(localParsed.length, expectedParsed.length); i += 1) {
    const a = localParsed[i];
    const b = expectedParsed[i];
    if (!a || !b) continue;

    if (a.unit === "ml" && b.unit === "ml" && a.amount > 0 && b.amount > 0) {
      const delta = Math.abs(a.amount - b.amount);
      if (delta > 0.5) {
        issues.push("ingredient_amount_mismatch");
        details.push(`Cantidad distinta en línea ${i + 1}: ${a.raw} vs ${b.raw}`);
      }
    }
  }

  return { issues, details };
}

export function compareRecipes(local: CocktailRecord, diffords: DiffordsRecipe): RecipeComparison {
  const expectedRecord = diffordsToTraviesoRecord(diffords, local);
  const issues: CompareIssue[] = [];
  const details: string[] = [];

  if (!local.sourceUrl) {
    issues.push("missing_source_url");
    details.push("Falta sourceUrl en la receta local");
  }

  if (methodLooksEnglish(local.method)) {
    issues.push("method_untranslated");
    details.push("El método local parece estar en inglés o sin expandir");
  }

  if (glassKey(local.glass) !== glassKey(expectedRecord.glass)) {
    issues.push("glass_mismatch");
    details.push(`Vaso: "${local.glass}" vs "${expectedRecord.glass}"`);
  }

  const ingCompare = compareIngredients(local.ingredients, expectedRecord.ingredients);
  issues.push(...ingCompare.issues);
  details.push(...ingCompare.details);

  if (expectedRecord.kcal && local.kcal && Math.abs(local.kcal - expectedRecord.kcal) > 15) {
    issues.push("kcal_mismatch");
    details.push(`Kcal: ${local.kcal} vs ${expectedRecord.kcal}`);
  }

  const uniqueIssues = [...new Set(issues)];
  const penalty = uniqueIssues.length * 12 + details.length * 4;
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return {
    score,
    issues: uniqueIssues,
    details,
    expected: {
      title: expectedRecord.title,
      glass: expectedRecord.glass,
      ingredients: expectedRecord.ingredients,
      method: expectedRecord.method,
      kcal: expectedRecord.kcal,
      rating: expectedRecord.rating,
    },
  };
}
