import type { VenueGuideEntry } from "@prisma/client";
import type { NormalizedVenueGuide } from "@/lib/venues/types";
import { parseAdditionalRankings } from "@/lib/venues/types";

/** Convierte un registro Prisma en forma normalizada para merge seguro con JSON/scrape. */
export function venueGuideEntryToNormalized(entry: VenueGuideEntry): NormalizedVenueGuide {
  return {
    slug: entry.slug,
    name: entry.name,
    city: entry.city,
    country: entry.country,
    address: entry.address,
    venueType: entry.venueType,
    photoUrl: entry.photoUrl,
    history: entry.history,
    verdict: entry.verdict,
    chefName: entry.chefName,
    worlds50bestRank: entry.worlds50bestRank,
    worlds50bestCategory: entry.worlds50bestCategory,
    worlds50bestYear: entry.worlds50bestYear,
    continent: entry.continent ?? undefined,
    listScope: entry.listScope,
    regionalRank: entry.regionalRank,
    additionalRankings: parseAdditionalRankings(entry.additionalRankings),
    sourceUrl: entry.sourceUrl,
    externalWebsite: entry.externalWebsite,
    googleBusinessId: entry.googleBusinessId,
    tripadvisorUrl: entry.tripadvisorUrl,
    tripadvisorPlaceId: entry.tripadvisorPlaceId,
    tripadvisorRating: entry.tripadvisorRating,
    venueCode: entry.venueCode,
    enrichmentSource: entry.enrichmentSource,
    latitude: entry.latitude,
    longitude: entry.longitude,
    establishmentTypes: entry.establishmentTypes,
    cuisineTypes: entry.cuisineTypes,
    starDishes: entry.starDishes,
    idealFor: entry.idealFor,
    venueFeatures: entry.venueFeatures,
    neighborhood: entry.neighborhood,
    priceRange: entry.priceRange,
    dailyMenuEnabled: entry.dailyMenuEnabled,
    dailyMenuNote: entry.dailyMenuNote,
    awards: entry.awards,
    venuePreferences: entry.venuePreferences,
    instagramUrl: entry.instagramUrl,
    tiktokUrl: entry.tiktokUrl,
  };
}
