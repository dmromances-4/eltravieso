/**
 * Mapeo de atributos externos (TripAdvisor, Google Places) → slugs de taxonomy.ts.
 * Uso previsto: enrich-venues-tripadvisor, futuro enrich-google-places.
 */

import {
  parseAwards,
  parseCuisineTypes,
  parseEstablishmentTypes,
  parseIdealFor,
  parsePriceRange,
  parseVenueFeatures,
  parseVenuePreferences,
} from "@/lib/venues/taxonomy";

export type TripAdvisorEnrichmentInput = {
  priceLevel?: number | null;
  cuisineLabels?: string[];
  features?: string[];
  amenities?: string[];
  awards?: string[];
};

const TA_CUISINE_ALIASES: Record<string, string> = {
  mediterranean: "mediterranea",
  mediterránea: "mediterranea",
  spanish: "espanola",
  española: "espanola",
  italian: "italiana",
  japanese: "japonesa",
  asian: "asiatica",
  mexican: "mexicana",
  fusion: "fusion",
  international: "internacional",
  vegan: "vegana",
  seafood: "marisqueria",
  french: "francesa",
  peruvian: "peruana",
  thai: "thai",
  indian: "india",
  greek: "griega",
  american: "americana",
};

const TA_FEATURE_ALIASES: Record<string, string> = {
  outdoor_seating: "terraza_exterior",
  terrace: "terraza_exterior",
  live_music: "musica_directo",
  scenic_view: "vistas",
  romantic: "romantico",
  family: "familias",
  groups: "grupos",
  wheelchair_accessible: "wheelchair",
  parking: "parking",
  reservations: "negocios",
};

const TA_AMENITY_ALIASES: Record<string, string> = {
  wheelchair_accessible: "wheelchair",
  highchairs_available: "high_chair",
  stroller_friendly: "stroller_friendly",
  dogs_allowed: "pets_allowed",
  smoking_area: "smoking_area",
  air_conditioning: "climate_control",
  accepts_credit_cards: "card_payment",
  cash_only: "cash_payment",
  dress_code: "dress_code",
  vegan_options: "vegan",
  vegetarian_friendly: "vegetarian",
  gluten_free_options: "gluten_free",
  halal: "halal",
  kosher: "kosher",
};

const TA_AWARD_ALIASES: Record<string, string> = {
  michelin: "michelin",
  "bib gourmand": "bib_gourmand",
  "green star": "green_star",
  repsol: "soles_repsol",
  "world's 50 best": "worlds50best",
};

function mapAliases(raw: string[], table: Record<string, string>): string[] {
  const out: string[] = [];
  for (const item of raw) {
    const key = item.toLowerCase().trim();
    const slug = table[key] ?? key.replace(/\s+/g, "_");
    out.push(slug);
  }
  return out;
}

/** TripAdvisor price level 1–4 → ticket medio simbólico. */
export function mapTripAdvisorPriceLevel(level: number | null | undefined): string | null {
  if (level == null || !Number.isFinite(level)) return null;
  if (level <= 1) return "under_15";
  if (level === 2) return "range_15_30";
  if (level === 3) return "range_30_50";
  return "over_50";
}

export function mapTripAdvisorEnrichment(input: TripAdvisorEnrichmentInput): {
  cuisineTypes: string[];
  idealFor: string[];
  venueFeatures: string[];
  venuePreferences: string[];
  awards: string[];
  priceRange: string | null;
} {
  const cuisineRaw = mapAliases(input.cuisineLabels ?? [], TA_CUISINE_ALIASES);
  const featureRaw = mapAliases(input.features ?? [], TA_FEATURE_ALIASES);
  const amenityRaw = mapAliases(input.amenities ?? [], TA_AMENITY_ALIASES);
  const awardRaw = mapAliases(input.awards ?? [], TA_AWARD_ALIASES);

  const idealFor = parseIdealFor(featureRaw);
  const venueFeatures = parseVenueFeatures(featureRaw);

  return {
    cuisineTypes: parseCuisineTypes(cuisineRaw),
    idealFor,
    venueFeatures,
    venuePreferences: parseVenuePreferences(amenityRaw),
    awards: parseAwards(awardRaw),
    priceRange: parsePriceRange(mapTripAdvisorPriceLevel(input.priceLevel) ?? undefined),
  };
}

export type GooglePlacesEnrichmentInput = {
  types?: string[];
  priceLevel?: number | null;
  neighborhood?: string | null;
  amenities?: string[];
};

const GMB_TYPE_ALIASES: Record<string, string> = {
  restaurant: "restaurante",
  bar: "bar",
  cafe: "cafeteria",
  night_club: "club",
  meal_delivery: "restaurante",
  meal_takeaway: "restaurante",
};

export function mapGooglePlacesEnrichment(input: GooglePlacesEnrichmentInput): {
  establishmentTypes: string[];
  neighborhood: string | null;
  venuePreferences: string[];
  priceRange: string | null;
} {
  const types = (input.types ?? []).map((t) => GMB_TYPE_ALIASES[t] ?? t);
  const amenities = mapAliases(input.amenities ?? [], TA_AMENITY_ALIASES);

  return {
    establishmentTypes: parseEstablishmentTypes(types),
    neighborhood: input.neighborhood?.trim().slice(0, 120) ?? null,
    venuePreferences: parseVenuePreferences(amenities),
    priceRange: parsePriceRange(mapTripAdvisorPriceLevel(input.priceLevel) ?? undefined),
  };
}
