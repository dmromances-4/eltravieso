export type RecipeImageInput = {
  title: string;
  glass: string;
  ingredients: string[];
  method?: string;
  sourceUrl?: string;
};

const BRAND_STYLE_SUFFIX =
  "Style: premium Spanish vermut brand El Travieso — electric blue accent lighting (#2B87B9), warm yellow highlights (#F9D142), subtle red artistic mood (#A62125), dark moody bar background, cinematic editorial cocktail photography, no text, no logos, no human faces, photorealistic glass and liquid, shallow depth of field, 4:5 vertical composition.";

const COMPOSITION_HINTS =
  "Shot on 85mm macro lens, three-quarter angle, condensation on glass, dark wood bar surface, soft bokeh background, professional bar lighting, magazine-quality food and drink photography.";

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

const GARNISH_KEYWORDS: Array<{ pattern: RegExp; garnish: string }> = [
  { pattern: /naranja|orange/i, garnish: "fresh orange peel twist" },
  { pattern: /lim[oó]n|lemon/i, garnish: "lemon twist or wheel" },
  { pattern: /lima|lime/i, garnish: "lime wedge or wheel" },
  { pattern: /cereza|cherry|maraschino/i, garnish: "maraschino cherry" },
  { pattern: /aceituna|olive/i, garnish: "green olive garnish" },
  { pattern: /menta|mint/i, garnish: "fresh mint sprig" },
  { pattern: /sal|salt/i, garnish: "salt rim on glass" },
  { pattern: /hielo|ice cube|rock/i, garnish: "large clear ice cube" },
];

export function inferLiquidTone(ingredients: string[]): string {
  const haystack = ingredients.join(" ").toLowerCase();
  const matched = COLOR_KEYWORDS.filter(({ pattern }) => pattern.test(haystack)).map(({ tone }) => tone);
  if (matched.length === 0) return "balanced neutral cocktail liquid with warm bar lighting";
  return matched.slice(0, 3).join(", ");
}

export function inferGarnish(ingredients: string[]): string {
  const haystack = ingredients.join(" ").toLowerCase();
  const matched = GARNISH_KEYWORDS.filter(({ pattern }) => pattern.test(haystack)).map(({ garnish }) => garnish);
  if (matched.length === 0) return "elegant classic cocktail garnish";
  return matched.slice(0, 2).join(" and ");
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

function buildRecipeCoreLines(input: RecipeImageInput): string[] {
  const ingredientList = input.ingredients.slice(0, 6).join(", ");
  const liquidTone = inferLiquidTone(input.ingredients);
  const technique = inferTechnique(input.method);
  const garnish = inferGarnish(input.ingredients);

  return [
    `Editorial cocktail photograph of "${input.title}", served in ${input.glass || "an elegant cocktail glass"}.`,
    `Liquid appearance: ${liquidTone}.`,
    `Garnish: ${garnish}.`,
    `Key ingredients visible or suggested: ${ingredientList || "classic bar ingredients"}.`,
    `Preparation feel: ${technique}.`,
    COMPOSITION_HINTS,
  ];
}

export function buildRecipeImagePrompt(input: RecipeImageInput): string {
  return [...buildRecipeCoreLines(input), BRAND_STYLE_SUFFIX].join(" ");
}

export function buildRecipeImagePromptFromReference(
  input: RecipeImageInput,
  referenceDescription: string,
): string {
  const core = buildRecipeCoreLines(input);
  return [
    ...core,
    `Visual inspiration from reference (adapt to our recipe, do not copy branding): ${referenceDescription.trim()}.`,
    "Create an original photorealistic image matching our glass, liquid color, garnish and brand mood.",
    BRAND_STYLE_SUFFIX,
  ].join(" ");
}

export function buildReferenceAnalysisPrompt(input: RecipeImageInput): string {
  return [
    "You are a food and cocktail photography director for El Travieso vermut brand.",
    `Analyze this reference image and describe ONLY visual qualities useful to recreate "${input.title}" in ${input.glass || "cocktail glass"}.`,
    `Our ingredients: ${input.ingredients.slice(0, 8).join(", ")}.`,
    "Describe: glass shape, liquid color, garnish, lighting angle, background mood, props.",
    "Do NOT mention watermarks, logos, text or brand names from the reference.",
    "Reply in 2-4 concise sentences in English for an image generation prompt.",
  ].join(" ");
}
