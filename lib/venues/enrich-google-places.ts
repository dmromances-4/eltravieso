/**
 * Enriquecimiento Google Places → campos editoriales de Venue.
 * Requiere GOOGLE_PLACES_API_KEY (no activar scrape masivo sin cuota revisada).
 */

import {
  mapGooglePlacesEnrichment,
  parseGooglePlaceApiResponse,
  parseGooglePlaceSearchResult,
  type GooglePlacesEnrichmentInput,
} from "@/lib/venues/enrich-taxonomy-mapper";
import type { VenueDetailFieldsParsed } from "@/lib/venues/venue-detail-fields";
import { mergeDetailFieldArrays } from "@/lib/venues/venue-profile-sync";

export type GooglePlaceDetails = GooglePlacesEnrichmentInput & {
  placeId: string;
  displayName?: string;
  googleMapsUri?: string | null;
};

export type GooglePlaceSearchResult = {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  types: string[];
  googleMapsUri?: string;
};

export type GooglePlaceVenueScalars = {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  externalWebsite: string | null;
  geocodeConfidence: string | null;
};

export type GooglePlaceVenueUpdate = Pick<
  VenueDetailFieldsParsed,
  "establishmentTypes" | "neighborhood" | "venuePreferences" | "venueFeatures" | "priceRange"
> &
  GooglePlaceVenueScalars & {
    googleBusinessId?: string | null;
    awards: string[];
    enrichmentSource: string;
  };

const PLACES_FIELD_MASK = [
  "types",
  "primaryType",
  "priceLevel",
  "addressComponents",
  "paymentOptions",
  "accessibilityOptions",
  "outdoorSeating",
  "liveMusic",
  "goodForChildren",
  "allowsDogs",
  "servesVegetarianFood",
  "servesBeer",
  "servesWine",
  "reservable",
  "formattedAddress",
  "location",
  "websiteUri",
].join(",");

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.types",
  "places.googleMapsUri",
].join(",");

const DEFAULT_RATE_MS = Number(process.env.GOOGLE_PLACES_RATE_MS ?? 200);

export function isGooglePlacesConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim());
}

export function googlePlacesRateMs(): number {
  return Number.isFinite(DEFAULT_RATE_MS) && DEFAULT_RATE_MS > 0 ? DEFAULT_RATE_MS : 200;
}

/** Normaliza `places/ChIJ…` → `ChIJ…`. */
export function normalizeGooglePlaceId(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.startsWith("places/") ? trimmed.slice("places/".length) : trimmed;
}

function googleApiKey(): string | null {
  return process.env.GOOGLE_PLACES_API_KEY?.trim() || null;
}

/** Convierte detalles de Places API (ya parseados) a campos persistibles. */
export function googlePlaceDetailsToVenueFields(
  details: GooglePlaceDetails,
): Pick<
  VenueDetailFieldsParsed,
  "establishmentTypes" | "neighborhood" | "venuePreferences" | "venueFeatures" | "priceRange"
> &
  GooglePlaceVenueScalars {
  const taxonomy = mapGooglePlacesEnrichment(details);
  return {
    ...taxonomy,
    address: details.formattedAddress?.trim().slice(0, 280) ?? null,
    latitude: details.latitude ?? null,
    longitude: details.longitude ?? null,
    externalWebsite: details.websiteUri?.trim().slice(0, 500) ?? null,
    geocodeConfidence:
      details.latitude != null && details.longitude != null ? "high" : null,
  };
}

type ExistingVenueForMerge = {
  googleBusinessId?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geocodeConfidence?: string | null;
  externalWebsite?: string | null;
  neighborhood?: string | null;
  priceRange?: string | null;
  establishmentTypes?: string[];
  cuisineTypes?: string[];
  starDishes?: string[];
  idealFor?: string[];
  venueFeatures?: string[];
  awards?: string[];
  venuePreferences?: string[];
};

function shouldUpdateCoords(venue: ExistingVenueForMerge): boolean {
  return (
    venue.latitude == null ||
    venue.longitude == null ||
    venue.geocodeConfidence === "low" ||
    venue.geocodeConfidence == null
  );
}

/** Merge conservador: solo rellena huecos del perfil editorial. */
export function buildGoogleVenueUpdate(
  venue: ExistingVenueForMerge,
  details: GooglePlaceDetails,
  options?: { assignPlaceId?: boolean },
): GooglePlaceVenueUpdate {
  const mapped = googlePlaceDetailsToVenueFields(details);
  const merged = mergeDetailFieldArrays(venue, mapped);
  const updateCoords = shouldUpdateCoords(venue);

  return {
    googleBusinessId:
      options?.assignPlaceId || !venue.googleBusinessId
        ? normalizeGooglePlaceId(details.placeId)
        : venue.googleBusinessId,
    establishmentTypes: merged.establishmentTypes,
    venueFeatures: merged.venueFeatures,
    venuePreferences: merged.venuePreferences,
    awards: merged.awards,
    neighborhood: venue.neighborhood ?? mapped.neighborhood,
    priceRange: venue.priceRange ?? mapped.priceRange,
    address: venue.address ?? mapped.address,
    latitude: updateCoords ? (venue.latitude ?? mapped.latitude) : venue.latitude ?? null,
    longitude: updateCoords ? (venue.longitude ?? mapped.longitude) : venue.longitude ?? null,
    externalWebsite: venue.externalWebsite ?? mapped.externalWebsite,
    geocodeConfidence:
      updateCoords && mapped.latitude != null && mapped.longitude != null
        ? "high"
        : venue.geocodeConfidence ?? null,
    enrichmentSource: "google_places",
  };
}

/** Fetch de detalles vía Places API (New). */
export async function fetchGooglePlaceDetails(
  placeId: string,
): Promise<GooglePlaceDetails | null> {
  const key = googleApiKey();
  const normalizedId = normalizeGooglePlaceId(placeId);
  if (!key || !normalizedId) return null;

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(normalizedId)}`;
  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": PLACES_FIELD_MASK,
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn(`Google Places ${normalizedId}: HTTP ${res.status} ${body.slice(0, 120)}`);
    return null;
  }

  const data = (await res.json()) as Record<string, unknown>;
  const parsed = parseGooglePlaceApiResponse(normalizedId, data);
  if (!parsed) return null;
  return parsed;
}

export type SearchGooglePlacesOptions = {
  latitude?: number | null;
  longitude?: number | null;
  languageCode?: string;
};

/** Búsqueda por texto (Places API New — searchText). */
export async function searchGooglePlaces(
  textQuery: string,
  options?: SearchGooglePlacesOptions,
): Promise<GooglePlaceSearchResult | null> {
  const key = googleApiKey();
  const query = textQuery.trim();
  if (!key || !query) return null;

  const body: Record<string, unknown> = {
    textQuery: query,
    languageCode: options?.languageCode ?? "es",
  };

  if (options?.latitude != null && options?.longitude != null) {
    body.locationBias = {
      circle: {
        center: { latitude: options.latitude, longitude: options.longitude },
        radius: 2_000,
      },
    };
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": SEARCH_FIELD_MASK,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.warn(`Google searchText "${query}": HTTP ${res.status} ${errBody.slice(0, 120)}`);
    return null;
  }

  const data = (await res.json()) as { places?: Record<string, unknown>[] };
  const first = data.places?.[0];
  if (!first) return null;

  return parseGooglePlaceSearchResult(first);
}

export function buildGoogleSearchQuery(parts: {
  name: string;
  city: string;
  country?: string | null;
}): string {
  return [parts.name, parts.city, parts.country].filter(Boolean).join(" ").trim();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
