import ai from "@/lib/ai/provider";
import { isTextAiAvailable } from "@/lib/ai/availability";
import {
  ENCODING_FIXES,
  GLASS_REPLACEMENTS,
  INGREDIENT_CLEANUP,
  JUNK_TITLE_PATTERNS,
  PRODUCT_REPLACEMENTS,
  buildPolishPrompt,
} from "@/lib/recipes/style-guide";
import { parseJsonObject } from "@/lib/recipes/parse";

export type PolishableRecipe = {
  title: string;
  slug: string;
  glass: string;
  ingredients: string[];
  method: string;
  abv?: string;
  kcal?: number;
  summary?: string;
};

function applyReplacements(text: string, rules: [RegExp, string][]): string {
  let out = text;
  for (const [pattern, replacement] of rules) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export function fixEncoding(text: string): string {
  return applyReplacements(text, ENCODING_FIXES);
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function dedupeIngredients(ingredients: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of ingredients) {
    const line = normalizeWhitespace(raw);
    if (!line) continue;
    const key = line.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(line);
  }
  return result;
}

function splitIngredientLines(ingredients: string[]): string[] {
  return ingredients.flatMap((item) =>
    item
      .split(/\r?\n|\|\|/)
      .map((part) => part.trim())
      .filter(Boolean),
  );
}

export function normalizeGlass(glass: string): string {
  let value = fixEncoding(glass).trim();
  if (!value) return "Copa de autor";

  for (const [pattern, replacement] of GLASS_REPLACEMENTS) {
    value = value.replace(pattern, replacement);
  }

  value = normalizeWhitespace(value.replace(/\(\d+[^)]*\)/g, "").replace(/\d+\s*cl\b/gi, ""));

  const lower = value.toLowerCase();
  if (/martini/.test(lower) && !/copa/.test(lower)) return "Copa de martini";
  if (/coupe/.test(lower) && !/copa/.test(lower)) return "Copa coupe";
  if (/old fashioned/.test(lower) && !/vaso/.test(lower)) return "Vaso old fashioned";
  if (/highball/.test(lower) && !/vaso/.test(lower)) return "Vaso highball";
  if (/collins/.test(lower) && !/vaso/.test(lower)) return "Vaso collins";
  if (/rocks/.test(lower) && !/vaso/.test(lower)) return "Vaso rocks";
  if (/flute|fluet/.test(lower) && !/copa/.test(lower)) return "Copa flute";
  if (/poco grande/.test(lower) && !/copa/.test(lower)) return "Copa poco grande";

  if (value.length < 3 || /^urban bar/i.test(value)) return "Copa de autor";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function normalizeIngredient(line: string): string {
  let value = fixEncoding(line).trim();
  value = applyReplacements(value, PRODUCT_REPLACEMENTS);
  value = applyReplacements(value, INGREDIENT_CLEANUP);
  value = value.replace(/^[\-\u2022*]+\s*/, "");
  return normalizeWhitespace(value);
}

function isJunkTitle(title: string): boolean {
  return JUNK_TITLE_PATTERNS.some((pattern) => pattern.test(title.trim()));
}

function inferTechnique(method: string): "stir" | "shake" | "build" | "blend" | "throw" {
  const m = method.toUpperCase();
  if (m.includes("SHAKE")) return "shake";
  if (m.includes("BLEND")) return "blend";
  if (m.includes("THROW")) return "throw";
  if (m.includes("STIR")) return "stir";
  return "build";
}

function articleForGlass(glass: string): "el" | "la" {
  const lower = glass.toLowerCase();
  if (/^vaso|^tiki|^copa balón/.test(lower)) return "el";
  return "la";
}

function extractGarnish(method: string): string | null {
  const garnishMatch = method.match(/[Gg]arnish[^.\n]*/);
  if (!garnishMatch) return null;
  return normalizeIngredient(
    garnishMatch[0]
      .replace(/^[Gg]arnish\s*(?:with|of)?\s*/i, "")
      .replace(/\.$/, "")
      .toLowerCase(),
  );
}

function extractCitrusExpress(method: string): string | null {
  const match = method.match(/EXPRESS[^.\n]*/i);
  if (!match) return null;
  return match[0]
    .replace(/^EXPRESS\s*/i, "")
    .replace(/\.$/, "")
    .trim()
    .toLowerCase();
}

/** Expande métodos importados en inglés a pasos descriptivos en español (sin IA). */
export function expandMethodToSpanish(recipe: PolishableRecipe): string {
  const technique = inferTechnique(recipe.method);
  const glass = normalizeGlass(recipe.glass);
  const art = articleForGlass(glass);
  const garnish = extractGarnish(recipe.method);
  const citrusExpress = extractCitrusExpress(recipe.method);
  const needsChilledGlass = /chilled glass|pre-chill|pre-chilled|FINE STRAIN into chilled/i.test(recipe.method);
  const onTheRocks = /ice-filled|on-the-rocks|over a large cube/i.test(recipe.method);
  const fineStrain = /FINE STRAIN|fine strain/i.test(recipe.method);

  const lines: string[] = [];
  let step = 1;

  if (garnish) {
    lines.push(`${step}. Prepara la guarnición: ${garnish}.`);
    step += 1;
  }

  if (needsChilledGlass && !onTheRocks) {
    lines.push(`${step}. Enfría ${art} ${glass.toLowerCase()} con hielo y agua; descarta el hielo antes de servir.`);
  } else if (onTheRocks) {
    lines.push(`${step}. Llena ${art} ${glass.toLowerCase()} con hielo cubito fresco (o un cubo grande si la receta lo indica).`);
  } else {
    lines.push(`${step}. Prepara ${art} ${glass.toLowerCase()} limpio y frío para servir.`);
  }
  step += 1;

  if (technique === "stir") {
    lines.push(`${step}. Vierte todos los ingredientes en un vaso mezclador con hielo cubito hasta cubrir los dedos.`);
    step += 1;
    lines.push(`${step}. Remueve con cuchara de bar unos 25-35 segundos, hasta que el vaso se empañe y la mezcla quede bien fría y diluida.`);
    step += 1;
    if (fineStrain) {
      lines.push(`${step}. Cuela con colador fino (doble colado opcional) en el vaso de servicio.`);
    } else {
      lines.push(`${step}. Cuela en el vaso preparado, con hielo fresco si corresponde.`);
    }
    step += 1;
  } else if (technique === "shake") {
    lines.push(`${step}. Vierte los ingredientes en una coctelera con hielo cubito.`);
    step += 1;
    lines.push(`${step}. Agita enérgicamente unos 12-15 segundos hasta que la coctelera esté muy fría al tacto.`);
    step += 1;
    lines.push(`${step}. Cuela con colador fino en el vaso preparado.`);
    step += 1;
  } else if (technique === "build") {
    lines.push(`${step}. Vierte los ingredientes en el vaso en el orden indicado, empezando por los espirituosos y terminando con refrescos o sodas.`);
    step += 1;
    lines.push(`${step}. Remueve suavemente con cuchara de bar unos 3-5 segundos para integrar y enfriar sin perder burbuja.`);
    step += 1;
  } else if (technique === "blend") {
    lines.push(`${step}. Añade los ingredientes a la batidora según el orden de la receta.`);
    step += 1;
    lines.push(`${step}. Incorpora hielo picado y tritura hasta obtener textura homogénea y bien fría.`);
    step += 1;
    lines.push(`${step}. Vierte en el vaso de servicio.`);
    step += 1;
  } else {
    lines.push(`${step}. Vierte los ingredientes en un vaso mezclador con hielo.`);
    step += 1;
    lines.push(`${step}. Mezcla con técnica throw (vertido entre tin y vaso) o remueve suavemente hasta enfriar.`);
    step += 1;
    lines.push(`${step}. Cuela en el vaso de servicio.`);
    step += 1;
  }

  if (citrusExpress) {
    lines.push(`${step}. Exprime los aceites de ${citrusExpress} sobre el cóctel y coloca la piel en el borde o dentro del vaso.`);
    step += 1;
  } else if (garnish) {
    lines.push(`${step}. Coloca la guarnición en el vaso con cuidado para realzar aroma y presentación.`);
    step += 1;
  }

  lines.push(`${step}. Sirve de inmediato, bien frío, y brinda con calma.`);
  return lines.join("\n");
}

export function applyRuleBasedPolish(recipe: PolishableRecipe): PolishableRecipe {
  const title = fixEncoding(recipe.title).trim();
  const ingredients = dedupeIngredients(
    splitIngredientLines(recipe.ingredients).map(normalizeIngredient).filter(Boolean),
  );

  let method = fixEncoding(recipe.method).trim();
  const looksEnglish =
    /^(STIR|SHAKE|POUR|BUILD|DRY BLEND|COMBINE|SELECT)/i.test(method) ||
    (method.includes("\n") && method.split("\n").filter(Boolean).every((l) => l === l.toUpperCase()));
  if (looksEnglish) {
    method = expandMethodToSpanish({ ...recipe, title, ingredients, method });
  }

  return {
    ...recipe,
    title,
    glass: normalizeGlass(recipe.glass),
    ingredients,
    method,
    abv: recipe.abv?.replace(/No especificado/i, "—") ?? recipe.abv,
  };
}

function parsePolishResponse(text: string): Partial<PolishableRecipe> & { summary?: string } {
  const parsed = parseJsonObject(text);
  if (!parsed) throw new Error("La IA no devolvió JSON válido.");

  const ingredients = Array.isArray(parsed.ingredients)
    ? parsed.ingredients.map((item) => String(item).trim()).filter(Boolean)
    : [];

  return {
    title: parsed.title != null ? String(parsed.title).trim() : undefined,
    glass: parsed.glass != null ? String(parsed.glass).trim() : undefined,
    ingredients,
    method: parsed.method != null ? String(parsed.method).trim() : undefined,
    abv: parsed.abv != null ? String(parsed.abv).trim() : undefined,
    summary: parsed.summary != null ? String(parsed.summary).trim() : undefined,
  };
}

export function validatePolishedRecipe(recipe: PolishableRecipe): void {
  if (!recipe.title?.trim() || isJunkTitle(recipe.title)) {
    throw new Error(`Título inválido: "${recipe.title}"`);
  }
  if (recipe.ingredients.length < 2) {
    throw new Error(`Pocos ingredientes en "${recipe.title}"`);
  }
  if (!recipe.method?.trim() || recipe.method.length < 40) {
    throw new Error(`Método demasiado corto en "${recipe.title}"`);
  }
  if (!recipe.glass?.trim() || recipe.glass.length < 3) {
    throw new Error(`Vaso inválido en "${recipe.title}"`);
  }
}

export async function polishRecipeWithAI(recipe: PolishableRecipe): Promise<PolishableRecipe> {
  const prepped = applyRuleBasedPolish(recipe);
  const prompt = buildPolishPrompt(prepped);
  const response = await ai.generateText(prompt, { maxTokens: 1200 });
  const parsed = parsePolishResponse(response.text);

  const polished: PolishableRecipe = applyRuleBasedPolish({
    ...prepped,
    title: parsed.title ?? prepped.title,
    glass: parsed.glass ?? prepped.glass,
    ingredients: parsed.ingredients?.length ? parsed.ingredients : prepped.ingredients,
    method: parsed.method ?? prepped.method,
    abv: parsed.abv ?? prepped.abv,
    summary: parsed.summary ?? prepped.summary,
  });

  validatePolishedRecipe(polished);
  return polished;
}

export async function polishRecipe(
  recipe: PolishableRecipe,
  options: { useAi?: boolean } = {},
): Promise<PolishableRecipe> {
  const rulesOnly = applyRuleBasedPolish(recipe);
  const canUseAi = Boolean(options.useAi && isTextAiAvailable() && process.env.AI_MOCK !== "true");

  if (!canUseAi) {
    validatePolishedRecipe(rulesOnly);
    return rulesOnly;
  }

  try {
    return await polishRecipeWithAI(recipe);
  } catch (error) {
    console.warn(`[polish] IA falló para ${recipe.slug}, usando reglas:`, error instanceof Error ? error.message : error);
    validatePolishedRecipe(rulesOnly);
    return rulesOnly;
  }
}
