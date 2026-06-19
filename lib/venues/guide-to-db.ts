import type { Prisma } from "@prisma/client";
import type { NormalizedVenueGuide } from "@/lib/venues/types";

export function venueGuideToDbFields(
  venue: NormalizedVenueGuide,
  coords: {
    latitude?: number | null;
    longitude?: number | null;
    geocodeConfidence?: string | null;
  } = {},
) {
  return {
    slug: venue.slug,
    name: venue.name,
    city: venue.city,
    country: venue.country ?? null,
    address: venue.address ?? null,
    venueType: venue.venueType,
    photoUrl: venue.photoUrl ?? null,
    history: venue.history ?? null,
    verdict: venue.verdict ?? null,
    chefName: venue.chefName ?? null,
    worlds50bestRank: venue.worlds50bestRank,
    worlds50bestCategory: venue.worlds50bestCategory,
    worlds50bestYear: venue.worlds50bestYear ?? null,
    continent: venue.continent ?? null,
    listScope: venue.listScope ?? "GLOBAL",
    regionalRank: venue.regionalRank ?? null,
    additionalRankings: (venue.additionalRankings ?? []) as Prisma.InputJsonValue,
    sourceUrl: venue.sourceUrl,
    externalWebsite: venue.externalWebsite ?? null,
    googleBusinessId: venue.googleBusinessId ?? null,
    tripadvisorUrl: venue.tripadvisorUrl ?? null,
    tripadvisorPlaceId: venue.tripadvisorPlaceId ?? null,
    tripadvisorRating: venue.tripadvisorRating ?? null,
    venueCode: venue.venueCode ?? null,
    enrichmentSource: venue.enrichmentSource ?? "worlds50best",
    latitude: coords.latitude ?? venue.latitude ?? null,
    longitude: coords.longitude ?? venue.longitude ?? null,
    geocodeConfidence: coords.geocodeConfidence ?? null,
    establishmentTypes: venue.establishmentTypes ?? [],
    cuisineTypes: venue.cuisineTypes ?? [],
    starDishes: venue.starDishes ?? [],
    idealFor: venue.idealFor ?? [],
    venueFeatures: venue.venueFeatures ?? [],
    neighborhood: venue.neighborhood ?? null,
    priceRange: venue.priceRange ?? null,
    dailyMenuEnabled: venue.dailyMenuEnabled ?? false,
    dailyMenuNote: venue.dailyMenuNote ?? null,
    awards: venue.awards ?? [],
    venuePreferences: venue.venuePreferences ?? [],
    instagramUrl: venue.instagramUrl ?? null,
    tiktokUrl: venue.tiktokUrl ?? null,
  };
}
