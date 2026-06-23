/**
 * Heurísticas conservadoras: texto editorial W50 → slugs de taxonomy.ts.
 * Sin APIs externas; solo matches explícitos en history/verdict/name.
 */

import {
  parseAwards,
  parseCuisineTypes,
  parseIdealFor,
  parseStarDishes,
  parseVenueFeatures,
} from "@/lib/venues/taxonomy";

export type EditorialHeuristicInput = {
  name?: string | null;
  history?: string | null;
  verdict?: string | null;
  chefName?: string | null;
};

export type EditorialHeuristicOutput = {
  cuisineTypes: string[];
  idealFor: string[];
  venueFeatures: string[];
  starDishes: string[];
  awards: string[];
};

type SlugRule = { pattern: RegExp; slug: string };

const CUISINE_RULES: SlugRule[] = [
  { pattern: /\b(?:japanese|japonesa|omakase|sushi|izakaya)\b/i, slug: "japonesa" },
  { pattern: /\b(?:spanish|española|espanola|tapas|iberico|iberico)\b/i, slug: "espanola" },
  { pattern: /\b(?:italian|italiana|pasta|trattoria)\b/i, slug: "italiana" },
  { pattern: /\b(?:french|francesa|bistro)\b/i, slug: "francesa" },
  { pattern: /\b(?:mexican|mexicana|taco)\b/i, slug: "mexicana" },
  { pattern: /\b(?:peruvian|peruana|ceviche|nikkei)\b/i, slug: "peruana" },
  { pattern: /\b(?:thai|tailandesa)\b/i, slug: "thai" },
  { pattern: /\b(?:indian|india|curry)\b/i, slug: "india" },
  { pattern: /\b(?:chinese|china|cantonese|sichuan|dim sum)\b/i, slug: "asiatica" },
  { pattern: /\b(?:korean|coreana)\b/i, slug: "asiatica" },
  { pattern: /\b(?:mediterranean|mediterranea)\b/i, slug: "mediterranea" },
  { pattern: /\b(?:seafood|marisquer|marisco|oyster)\b/i, slug: "marisqueria" },
  { pattern: /\b(?:vegan|plant-based|plant based)\b/i, slug: "vegana" },
  { pattern: /\b(?:fusion)\b/i, slug: "fusion" },
  { pattern: /\b(?:greek|griega)\b/i, slug: "griega" },
  { pattern: /\b(?:american|americana|bbq|barbecue)\b/i, slug: "americana" },
  { pattern: /\b(?:latin american|latinoamericana)\b/i, slug: "latinoamericana" },
];

const IDEAL_FOR_RULES: SlugRule[] = [
  { pattern: /\b(?:romantic|romántico|date night|couples?|intimate)\b/i, slug: "romantico" },
  { pattern: /\b(?:families?|family-friendly|kids?)\b/i, slug: "familias" },
  { pattern: /\b(?:groups?|large parties)\b/i, slug: "grupos" },
  { pattern: /\b(?:business|corporate|power lunch)\b/i, slug: "negocios" },
  { pattern: /\b(?:celebration|celebrations?|festive|special occasion|birthday|dancing)\b/i, slug: "celebraciones" },
  { pattern: /\b(?:tourists?|visitors)\b/i, slug: "turistas" },
  { pattern: /\b(?:brunch)\b/i, slug: "brunch" },
  { pattern: /\b(?:solo dining|dining alone)\b/i, slug: "solo" },
  { pattern: /\b(?:afterwork|after work|after-work)\b/i, slug: "afterwork" },
];

const FEATURE_RULES: SlugRule[] = [
  { pattern: /\b(?:rooftop|terrace|terraza|outdoor seating|al fresco)\b/i, slug: "terraza_exterior" },
  { pattern: /\b(?:live music|música en vivo|musica en vivo|jazz bar)\b/i, slug: "musica_directo" },
  { pattern: /\b(?:view|vista|panoramic|skyline|waterfront)\b/i, slug: "vistas" },
  { pattern: /\b(?:intimate|cozy|cosy|speakeasy|hidden)\b/i, slug: "ambiente_intimo" },
  { pattern: /\b(?:lively|vibrant|energetic|party)\b/i, slug: "animado" },
  { pattern: /\b(?:quiet|tranquil|serene)\b/i, slug: "silencioso" },
  { pattern: /\b(?:courtyard|patio)\b/i, slug: "terraza_interior" },
];

const AWARD_RULES: SlugRule[] = [
  { pattern: /\b(?:michelin|three star|two star|one star|3 star|2 star|1 star)\b/i, slug: "michelin" },
  { pattern: /\bbib gourmand\b/i, slug: "bib_gourmand" },
  { pattern: /\bgreen star\b/i, slug: "green_star" },
  { pattern: /\b(?:repsol|soles repsol)\b/i, slug: "soles_repsol" },
  { pattern: /\bworld'?s 50 best\b/i, slug: "worlds50best" },
];

const STAR_DISH_PATTERNS = [
  /\bsignature dish(?:es)?(?:\s+(?:is|are|include))?\s+([^.!?\n]{3,80})/i,
  /\bfamous for\s+(?:its?\s+)?([^.!?\n]{3,80})/i,
  /\bknown for\s+(?:its?\s+)?([^.!?\n]{3,80})/i,
  /\bstar dish(?:es)?\s+(?:is|are|include)\s+([^.!?\n]{3,80})/i,
];

function collectSlugs(text: string, rules: SlugRule[]): string[] {
  const found: string[] = [];
  for (const rule of rules) {
    if (rule.pattern.test(text)) found.push(rule.slug);
  }
  return found;
}

function extractStarDishesFromText(text: string): string[] {
  const candidates: string[] = [];
  for (const pattern of STAR_DISH_PATTERNS) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const parts = match[1]
      .split(/,|;/)
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter((s) => s.length >= 3 && s.length <= 60);
    candidates.push(...parts);
  }
  return parseStarDishes(candidates);
}

function editorialCorpus(input: EditorialHeuristicInput): string {
  return [input.name, input.verdict, input.history, input.chefName]
    .filter(Boolean)
    .join("\n\n");
}

/** Deriva taxonomía desde texto editorial scrapeado (conservador). */
export function mapEditorialHeuristics(input: EditorialHeuristicInput): EditorialHeuristicOutput {
  const text = editorialCorpus(input);
  if (!text.trim()) {
    return {
      cuisineTypes: [],
      idealFor: [],
      venueFeatures: [],
      starDishes: [],
      awards: [],
    };
  }

  return {
    cuisineTypes: parseCuisineTypes(collectSlugs(text, CUISINE_RULES)),
    idealFor: parseIdealFor(collectSlugs(text, IDEAL_FOR_RULES)),
    venueFeatures: parseVenueFeatures(collectSlugs(text, FEATURE_RULES)),
    starDishes: extractStarDishesFromText(text),
    awards: parseAwards(collectSlugs(text, AWARD_RULES)),
  };
}

/** Convierte slugs internos a labels TA para CSV import. */
export function editorialToTripAdvisorLabels(output: EditorialHeuristicOutput): {
  cuisineLabels: string[];
  features: string[];
  awards: string[];
} {
  const cuisineLabels = output.cuisineTypes.map((slug) => {
    const reverse: Record<string, string> = {
      japonesa: "japanese",
      espanola: "spanish",
      italiana: "italian",
      francesa: "french",
      mexicana: "mexican",
      peruana: "peruvian",
      mediterranea: "mediterranean",
      marisqueria: "seafood",
      vegana: "vegan",
      asiatica: "asian",
    };
    return reverse[slug] ?? slug;
  });

  const features: string[] = [];
  if (output.idealFor.includes("romantico")) features.push("romantic");
  if (output.idealFor.includes("familias")) features.push("family");
  if (output.idealFor.includes("grupos")) features.push("groups");
  if (output.venueFeatures.includes("terraza_exterior")) features.push("outdoor_seating");
  if (output.venueFeatures.includes("musica_directo")) features.push("live_music");
  if (output.venueFeatures.includes("vistas")) features.push("scenic_view");

  return {
    cuisineLabels,
    features,
    awards: output.awards,
  };
}

/** Amenities TA para CSV import (columna amenities → venuePreferences). */
export function editorialToTripAdvisorAmenities(
  output: EditorialHeuristicOutput,
  corpus?: string,
): string[] {
  const text = corpus ?? "";
  const amenities = new Set<string>();

  if (output.idealFor.includes("familias")) amenities.add("good_for_children");
  if (output.cuisineTypes.includes("vegana")) amenities.add("vegan_options");
  if (output.cuisineTypes.some((c) => c === "vegetarian" || c === "vegana")) {
    amenities.add("vegetarian_friendly");
  }
  if (output.venueFeatures.includes("musica_directo")) amenities.add("live_music");
  if (/\b(?:dress code|formal attire|jacket required)\b/i.test(text)) {
    amenities.add("dress_code");
  }
  if (/\b(?:wheelchair|accessible|accessibility)\b/i.test(text)) {
    amenities.add("wheelchair_accessible");
  }
  if (/\b(?:reservation|reservations|book ahead)\b/i.test(text)) {
    amenities.add("reservations");
  }

  // Fine-dining W50: asumir pagos con tarjeta salvo mención explícita de cash only
  if (!/\bcash only\b/i.test(text)) {
    amenities.add("accepts_credit_cards");
  }

  return [...amenities];
}
