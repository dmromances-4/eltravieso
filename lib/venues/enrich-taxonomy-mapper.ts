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
  catalan: "espanola",
  basque: "espanola",
  italian: "italiana",
  japanese: "japonesa",
  omakase: "japonesa",
  sushi: "japonesa",
  asian: "asiatica",
  chinese: "asiatica",
  cantonese: "asiatica",
  korean: "asiatica",
  mexican: "mexicana",
  fusion: "fusion",
  international: "internacional",
  vegan: "vegana",
  vegetarian: "vegana",
  seafood: "marisqueria",
  marisqueria: "marisqueria",
  french: "francesa",
  peruvian: "peruana",
  nikkei: "peruana",
  thai: "thai",
  indian: "india",
  greek: "griega",
  american: "americana",
  latin: "latinoamericana",
  "latin american": "latinoamericana",
  tapas: "tapas",
  barbecue: "asador",
  bbq: "asador",
};

const TA_FEATURE_ALIASES: Record<string, string> = {
  outdoor_seating: "terraza_exterior",
  terrace: "terraza_exterior",
  rooftop: "terraza_exterior",
  live_music: "musica_directo",
  scenic_view: "vistas",
  views: "vistas",
  romantic: "romantico",
  date_night: "romantico",
  family: "familias",
  family_friendly: "familias",
  groups: "grupos",
  wheelchair_accessible: "wheelchair",
  parking: "parking",
  reservations: "negocios",
  business: "negocios",
  brunch: "brunch",
  quiet: "silencioso",
  lively: "animado",
  intimate: "ambiente_intimo",
};

const TA_AMENITY_ALIASES: Record<string, string> = {
  wheelchair_accessible: "wheelchair",
  highchairs_available: "high_chair",
  high_chair: "high_chair",
  stroller_friendly: "stroller_friendly",
  dogs_allowed: "pets_allowed",
  pets_allowed: "pets_allowed",
  smoking_area: "smoking_area",
  air_conditioning: "climate_control",
  climate_control: "climate_control",
  accepts_credit_cards: "card_payment",
  card_payment: "card_payment",
  cash_only: "cash_payment",
  cash_payment: "cash_payment",
  contactless: "contactless",
  contactless_payment: "contactless",
  mobile_payment: "mobile_payment",
  dress_code: "dress_code",
  vegan_options: "vegan",
  vegetarian_friendly: "vegetarian",
  vegetarian: "vegetarian",
  gluten_free_options: "gluten_free",
  gluten_free: "gluten_free",
  halal: "halal",
  kosher: "kosher",
  kids_welcome: "kids_welcome",
  good_for_children: "kids_welcome",
  sports_broadcast: "sports_broadcast",
  live_show: "live_show",
  live_music: "live_show",
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
  primaryType?: string | null;
  priceLevel?: number | null;
  neighborhood?: string | null;
  amenities?: string[];
  features?: string[];
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  websiteUri?: string | null;
};

const GMB_TYPE_ALIASES: Record<string, string> = {
  restaurant: "restaurante",
  bar: "bar",
  cafe: "cafeteria",
  night_club: "club",
  meal_delivery: "restaurante",
  meal_takeaway: "restaurante",
  wine_bar: "vinoteca",
  cocktail_bar: "cocteleria",
};

const GMB_AMENITY_ALIASES: Record<string, string> = {
  ...TA_AMENITY_ALIASES,
  good_for_children: "kids_welcome",
  allows_dogs: "pets_allowed",
  live_music: "live_show",
  serves_vegetarian: "vegetarian",
  contactless_payment: "contactless",
  mobile_payment: "mobile_payment",
};

const GMB_FEATURE_ALIASES: Record<string, string> = {
  outdoor_seating: "terraza_exterior",
  live_music: "musica_directo",
};

export function mapGooglePlacesEnrichment(input: GooglePlacesEnrichmentInput): {
  establishmentTypes: string[];
  neighborhood: string | null;
  venuePreferences: string[];
  venueFeatures: string[];
  priceRange: string | null;
} {
  const rawTypes = input.primaryType
    ? [input.primaryType, ...(input.types ?? [])]
    : (input.types ?? []);
  const types = rawTypes.map((t) => GMB_TYPE_ALIASES[t] ?? t);
  const amenities = mapAliases(input.amenities ?? [], GMB_AMENITY_ALIASES);
  const features = mapAliases(input.features ?? [], GMB_FEATURE_ALIASES);

  return {
    establishmentTypes: parseEstablishmentTypes(types),
    neighborhood: input.neighborhood?.trim().slice(0, 120) ?? null,
    venuePreferences: parseVenuePreferences(amenities),
    venueFeatures: parseVenueFeatures(features),
    priceRange: parsePriceRange(mapTripAdvisorPriceLevel(input.priceLevel) ?? undefined),
  };
}

type GoogleAddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

/** Parsea respuesta cruda de Places API (New) → GooglePlaceDetails. */
export function parseGooglePlaceApiResponse(
  placeId: string,
  data: Record<string, unknown>,
): {
  placeId: string;
  displayName?: string;
  types?: string[];
  primaryType?: string | null;
  priceLevel?: number | null;
  neighborhood?: string | null;
  amenities?: string[];
  features?: string[];
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  websiteUri?: string | null;
  googleMapsUri?: string | null;
} | null {
  if (!data || typeof data !== "object") return null;

  const primaryType =
    typeof data.primaryType === "string" && data.primaryType.trim()
      ? data.primaryType.trim()
      : null;
  const types = Array.isArray(data.types) ? data.types.map(String) : [];
  const priceLevel =
    typeof data.priceLevel === "string"
      ? priceLevelFromEnum(data.priceLevel)
      : typeof data.priceLevel === "number"
        ? data.priceLevel
        : null;

  const addressComponents = Array.isArray(data.addressComponents)
    ? (data.addressComponents as GoogleAddressComponent[])
    : [];
  const neighborhood = extractNeighborhoodFromComponents(addressComponents);

  const amenities: string[] = [];
  const features: string[] = [];
  if (data.outdoorSeating === true) features.push("outdoor_seating");
  if (data.liveMusic === true) {
    amenities.push("live_music");
    features.push("live_music");
  }
  if (data.goodForChildren === true) amenities.push("good_for_children");
  if (data.allowsDogs === true) amenities.push("allows_dogs");
  if (data.servesVegetarianFood === true) amenities.push("serves_vegetarian");
  if (data.reservable === true) amenities.push("reservable");

  const payment = data.paymentOptions as Record<string, boolean> | undefined;
  if (payment?.acceptsCreditCards) amenities.push("accepts_credit_cards");
  if (payment?.acceptsCashOnly) amenities.push("cash_only");
  if (payment?.acceptsNfc) amenities.push("contactless_payment");

  const accessibility = data.accessibilityOptions as Record<string, boolean> | undefined;
  if (accessibility?.wheelchairAccessibleEntrance) amenities.push("wheelchair_accessible");
  if (accessibility?.wheelchairAccessibleParking) amenities.push("parking");

  const displayName =
    typeof data.displayName === "object" &&
    data.displayName != null &&
    "text" in (data.displayName as object)
      ? String((data.displayName as { text?: string }).text ?? "")
      : undefined;

  const formattedAddress =
    typeof data.formattedAddress === "string" && data.formattedAddress.trim()
      ? data.formattedAddress.trim()
      : null;

  const location = data.location as { latitude?: number; longitude?: number } | undefined;
  const latitude =
    typeof location?.latitude === "number" && Number.isFinite(location.latitude)
      ? location.latitude
      : null;
  const longitude =
    typeof location?.longitude === "number" && Number.isFinite(location.longitude)
      ? location.longitude
      : null;

  const websiteUri =
    typeof data.websiteUri === "string" && data.websiteUri.trim() ? data.websiteUri.trim() : null;

  const googleMapsUri =
    typeof data.googleMapsUri === "string" && data.googleMapsUri.trim()
      ? data.googleMapsUri.trim()
      : null;

  return {
    placeId,
    displayName: displayName || undefined,
    types,
    primaryType,
    priceLevel,
    neighborhood,
    amenities,
    features,
    formattedAddress,
    latitude,
    longitude,
    websiteUri,
    googleMapsUri,
  };
}

/** Parsea un candidato de searchText (Places API New). */
export function parseGooglePlaceSearchResult(
  data: Record<string, unknown>,
): {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  types: string[];
  googleMapsUri?: string;
} | null {
  if (!data || typeof data !== "object") return null;

  const rawId = typeof data.id === "string" ? data.id : "";
  const placeId = rawId.replace(/^places\//, "").trim();
  if (!placeId) return null;

  const displayName =
    typeof data.displayName === "object" &&
    data.displayName != null &&
    "text" in (data.displayName as object)
      ? String((data.displayName as { text?: string }).text ?? "").trim()
      : "";
  const formattedAddress =
    typeof data.formattedAddress === "string" ? data.formattedAddress.trim() : "";
  const location = data.location as { latitude?: number; longitude?: number } | undefined;
  const latitude = location?.latitude;
  const longitude = location?.longitude;

  if (!displayName || latitude == null || longitude == null) return null;

  const types = Array.isArray(data.types) ? data.types.map(String) : [];
  const googleMapsUri =
    typeof data.googleMapsUri === "string" && data.googleMapsUri.trim()
      ? data.googleMapsUri.trim()
      : undefined;

  return {
    placeId,
    displayName,
    formattedAddress,
    latitude,
    longitude,
    types,
    googleMapsUri,
  };
}

function priceLevelFromEnum(value: string): number | null {
  const map: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  return map[value] ?? null;
}

function extractNeighborhoodFromComponents(components: GoogleAddressComponent[]): string | null {
  const priority = ["neighborhood", "sublocality", "sublocality_level_1", "administrative_area_level_3"];
  for (const type of priority) {
    const match = components.find((c) => c.types?.includes(type));
    const text = match?.longText ?? match?.shortText;
    if (text?.trim()) return text.trim().slice(0, 120);
  }
  return null;
}
