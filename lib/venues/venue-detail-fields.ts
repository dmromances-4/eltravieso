import {
  parseAwards,
  parseCuisineTypes,
  parseEstablishmentTypes,
  parseIdealFor,
  parsePriceRange,
  parseStarDishes,
  parseVenueFeatures,
  parseVenuePreferences,
  normalizeSocialHandle,
  normalizeTikTokHandle,
} from "@/lib/venues/taxonomy";

export type VenueDetailFieldsInput = {
  establishmentTypes?: unknown;
  cuisineTypes?: unknown;
  starDishes?: unknown;
  idealFor?: unknown;
  venueFeatures?: unknown;
  neighborhood?: unknown;
  priceRange?: unknown;
  dailyMenuEnabled?: unknown;
  dailyMenuNote?: unknown;
  awards?: unknown;
  venuePreferences?: unknown;
  instagramUrl?: unknown;
  tiktokUrl?: unknown;
  tripadvisorUrl?: unknown;
};

export type VenueDetailFieldsParsed = {
  establishmentTypes: string[];
  cuisineTypes: string[];
  starDishes: string[];
  idealFor: string[];
  venueFeatures: string[];
  neighborhood: string | null;
  priceRange: string | null;
  dailyMenuEnabled: boolean;
  dailyMenuNote: string | null;
  awards: string[];
  venuePreferences: string[];
  instagramUrl: string | null;
  tiktokUrl: string | null;
  tripadvisorUrl: string | null;
};

export function parseVenueDetailFields(body: VenueDetailFieldsInput): VenueDetailFieldsParsed {
  const parsed = {
    establishmentTypes: parseEstablishmentTypes(body.establishmentTypes),
    cuisineTypes: parseCuisineTypes(body.cuisineTypes),
    starDishes: parseStarDishes(body.starDishes),
    idealFor: parseIdealFor(body.idealFor),
    venueFeatures: parseVenueFeatures(body.venueFeatures),
    neighborhood:
      typeof body.neighborhood === "string" && body.neighborhood.trim()
        ? body.neighborhood.trim().slice(0, 120)
        : null,
    priceRange: parsePriceRange(body.priceRange),
    dailyMenuEnabled: Boolean(body.dailyMenuEnabled),
    dailyMenuNote:
      typeof body.dailyMenuNote === "string" && body.dailyMenuNote.trim()
        ? body.dailyMenuNote.trim().slice(0, 280)
        : null,
    awards: parseAwards(body.awards),
    venuePreferences: parseVenuePreferences(body.venuePreferences),
    instagramUrl: normalizeSocialHandle(
      typeof body.instagramUrl === "string" ? body.instagramUrl : null,
    ),
    tiktokUrl: normalizeTikTokHandle(typeof body.tiktokUrl === "string" ? body.tiktokUrl : null),
    tripadvisorUrl:
      typeof body.tripadvisorUrl === "string" && body.tripadvisorUrl.trim()
        ? body.tripadvisorUrl.trim()
        : null,
  };

  const dressCodeText =
    typeof (body as { dressCode?: unknown }).dressCode === "string"
      ? (body as { dressCode: string }).dressCode.trim()
      : "";
  if (dressCodeText && !parsed.venuePreferences.includes("dress_code")) {
    parsed.venuePreferences = [...parsed.venuePreferences, "dress_code"];
  }

  return parsed;
}
