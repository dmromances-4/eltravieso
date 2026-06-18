/**
 * Stub de enriquecimiento Google Places → campos editoriales de Venue.
 * Requiere GOOGLE_PLACES_API_KEY (no activar scrape masivo sin cuota revisada).
 */

import { mapGooglePlacesEnrichment, type GooglePlacesEnrichmentInput } from "@/lib/venues/enrich-taxonomy-mapper";
import type { VenueDetailFieldsParsed } from "@/lib/venues/venue-detail-fields";

export type GooglePlaceDetails = GooglePlacesEnrichmentInput & {
  placeId: string;
  displayName?: string;
};

export function isGooglePlacesConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim());
}

/** Convierte detalles de Places API (ya parseados) a campos persistibles. */
export function googlePlaceDetailsToVenueFields(
  details: GooglePlaceDetails,
): Pick<
  VenueDetailFieldsParsed,
  "establishmentTypes" | "neighborhood" | "venuePreferences" | "priceRange"
> {
  return mapGooglePlacesEnrichment(details);
}

/**
 * Fetch de detalles — stub: devuelve null hasta conectar Places API (New).
 * Implementación futura: GET places.googleapis.com/v1/places/{placeId}
 */
export async function fetchGooglePlaceDetails(
  _placeId: string,
): Promise<GooglePlaceDetails | null> {
  if (!isGooglePlacesConfigured()) return null;
  return null;
}
