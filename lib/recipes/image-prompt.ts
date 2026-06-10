export type RecipeImageInput = {
  title: string;
  glass: string;
  ingredients: string[];
  method?: string;
};

const BRAND_STYLE_SUFFIX =
  "Style: premium Spanish vermut brand El Travieso — electric blue accent lighting (#2B87B9), warm yellow highlights (#F9D142), subtle red artistic mood (#A62125), dark moody bar background, cinematic editorial cocktail photography, no text, no logos, no human faces, photorealistic glass and liquid, shallow depth of field, 4:5 vertical composition.";

const COLOR_KEYWORDS: Array<{ pattern: RegExp; tone: string }> = [
  { pattern: /vermut|vermouth|rosso|rojo|sweet/i, tone: "deep amber-red vermouth tone" },
  { pattern: /gin|london dry|beefeater|tanqueray|hayman/i, tone: "clear pale gin with botanical notes" },
  { pattern: /whisky|whiskey|bourbon|rye|scotch/i, tone: "golden amber whiskey tone" },
  { pattern: /rum|cacao|coconut/i, tone: "warm tropical rum tone" },
  { pattern: /tequila|mezcal|agave/i, tone: "silver or golden agave spirit tone" },
  { pattern: /campari|aperol|bitter|amaro/i, tone: "bitter orange-red aperitif tone" },
  { pattern: /lemon|lime|citric|citrus|naranja|orange|grapefruit/i, tone: "bright citrus yellow-green accents" },
  { pattern: /coffee|espresso|cacao|chocolate/i, tone: "dark coffee brown tone" },
  { pattern: /soda|tonic|agua|water|sparkling/i, tone: "clear sparkling bubbles" },
  { pattern: /champagne|prosecco|cava|espumoso/i, tone: "pale golden sparkling wine" },
];

export function inferLiquidTone(ingredients: string[]): string {
  const haystack = ingredients.join(" ").toLowerCase();
  const matched = COLOR_KEYWORDS.filter(({ pattern }) => pattern.test(haystack)).map(({ tone }) => tone);
  if (matched.length === 0) return "balanced neutral cocktail liquid with warm bar lighting";
  return matched.slice(0, 3).join(", ");
}

export function inferTechnique(method?: string): string {
  if (!method) return "professionally garnished";
  const m = method.toLowerCase();
  if (m.includes("shake")) return "freshly shaken, slightly frothy texture";
  if (m.includes("stir")) return "crystal-clear stirred texture";
  if (m.includes("build") || m.includes("pour")) return "built directly in the glass";
  if (m.includes("muddle")) return "muddled fresh ingredients visible";
  if (m.includes("blend")) return "smooth blended texture";
  return "professionally garnished";
}

export function buildRecipeImagePrompt(input: RecipeImageInput): string {
  const ingredientList = input.ingredients.slice(0, 6).join(", ");
  const liquidTone = inferLiquidTone(input.ingredients);
  const technique = inferTechnique(input.method);

  return [
    `Editorial cocktail photograph of "${input.title}", served in ${input.glass || "an elegant cocktail glass"}.`,
    `Liquid appearance: ${liquidTone}.`,
    `Key ingredients visible or suggested: ${ingredientList || "classic bar ingredients"}.`,
    `Preparation feel: ${technique}.`,
    BRAND_STYLE_SUFFIX,
  ].join(" ");
}
