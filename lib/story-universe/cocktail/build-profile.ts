import { inferGarnish, inferLiquidTone, inferTechnique } from "@/lib/recipes/image-prompt";
import type { CocktailRecord } from "@/types/cocktail";
import type { CocktailNarrativeProfile } from "../types";
import { slugifyId } from "../slugify";

const SPIRIT_KEYWORDS: Array<{ pattern: RegExp; aromatic: string; taste: string; personality: string }> = [
  { pattern: /gin|ginebra/i, aromatic: "balsámico", taste: "seco", personality: "elegante" },
  { pattern: /vermut|vermouth/i, aromatic: "herbal", taste: "amargo-dulce", personality: "clásico" },
  { pattern: /whisky|whiskey|bourbon/i, aromatic: "ahumado", taste: "cálido", personality: "contundente" },
  { pattern: /rum|ron/i, aromatic: "tropical", taste: "dulce", personality: "libertino" },
  { pattern: /campari|aperol|bitter/i, aromatic: "amargo cítrico", taste: "intenso", personality: "rebelde" },
  { pattern: /tequila|mezcal/i, aromatic: "agave", taste: "mineral", personality: "salvaje" },
  { pattern: /champagne|prosecco|cava/i, aromatic: "floral", taste: "efervescente", personality: "festivo" },
];

function inferIntensity(cocktail: CocktailRecord): 1 | 2 | 3 | 4 | 5 {
  const ing = cocktail.ingredients.join(" ").toLowerCase();
  const abv = cocktail.abv && cocktail.abv !== "—" ? parseFloat(cocktail.abv) : 0;
  if (abv >= 25 || /absenta|everclear|151/.test(ing)) return 5;
  if (abv >= 18 || /whisky|bourbon|mezcal/.test(ing)) return 4;
  if (abv >= 12 || /gin|rum|tequila/.test(ing)) return 3;
  if (/vermut|wine|sherry/.test(ing)) return 2;
  return 2;
}

function buildSensoryProfiles(cocktail: CocktailRecord): {
  aromatic: string[];
  taste: string[];
  personality: string[];
} {
  const haystack = cocktail.ingredients.join(" ");
  const aromatic = new Set<string>();
  const taste = new Set<string>();
  const personality = new Set<string>();

  for (const row of SPIRIT_KEYWORDS) {
    if (row.pattern.test(haystack)) {
      aromatic.add(row.aromatic);
      taste.add(row.taste);
      personality.add(row.personality);
    }
  }

  if (aromatic.size === 0) aromatic.add("equilibrado");
  if (taste.size === 0) taste.add("suave");
  if (personality.size === 0) personality.add("misterioso");

  return {
    aromatic: [...aromatic],
    taste: [...taste],
    personality: [...personality],
  };
}

function buildSymbolism(cocktail: CocktailRecord, personality: string[]): string[] {
  const tone = inferLiquidTone(cocktail.ingredients);
  const symbols = ["brindis", "noche", "conversación"];
  if (/amargo|bitter|campari/.test(tone + cocktail.ingredients.join(" "))) {
    symbols.push("ironía", "madurez amarga");
  }
  if (personality.includes("elegante")) symbols.push("ritual", "distancia emocional");
  if (personality.includes("rebelde")) symbols.push("transgresión", "última ronda");
  return symbols;
}

function buildNarrativeHooks(cocktail: CocktailRecord, personality: string[]): string[] {
  const garnish = inferGarnish(cocktail.ingredients);
  const technique = inferTechnique(cocktail.method);
  const hooks = [
    `Alguien pide un ${cocktail.title} cuando ya no queda nada que perder`,
    `El ${cocktail.glass || "copa"} refleja una promesa incumplida`,
    `Un ${personality[0] ?? "desconocido"} entra al bar y cambia la medida de todo`,
  ];
  if (garnish.includes("orange")) hooks.push("Un twist de naranja cae como un recuerdo agridulce");
  if (technique.includes("shake")) hooks.push("El hielo cruje como secretos que no debían salir");
  hooks.push(`La receta del ${cocktail.title} es la única verdad compartida en la mesa`);
  return hooks.slice(0, 5);
}

export function buildCocktailNarrativeProfile(cocktail: CocktailRecord): CocktailNarrativeProfile {
  const sensory = buildSensoryProfiles(cocktail);
  const color = inferLiquidTone(cocktail.ingredients);
  const personality = sensory.personality;

  return {
    cocktailSlug: cocktail.slug,
    cocktailTitle: cocktail.title,
    aromaticProfile: sensory.aromatic,
    tasteProfile: sensory.taste,
    color,
    intensity: inferIntensity(cocktail),
    personality,
    symbolism: buildSymbolism(cocktail, personality),
    evokedSensations: [
      cocktail.kcal > 200 ? "calor etílico" : "frescura breve",
      personality.includes("amargo") || personality.includes("rebelde") ? "aftertaste seco" : "calma momentánea",
      "clink de hielo",
    ],
    narrativeHooks: buildNarrativeHooks(cocktail, personality),
    originHint: cocktail.sourceUrl ? `Inspiración clásica (${slugifyId(cocktail.slug)})` : undefined,
  };
}

export function buildAllCocktailProfiles(cocktails: CocktailRecord[]): CocktailNarrativeProfile[] {
  return cocktails.map(buildCocktailNarrativeProfile);
}
