import type { VenueContinent, VenueListScope, Worlds50BestCategory } from "@prisma/client";
import type { NormalizedVenueGuide, VenueRanking } from "@/lib/venues/types";
import { normalizeCanonicalRegions } from "@/lib/venues/region-tags";
import { enrichGuideFromScrape } from "@/lib/venues/venue-profile-sync";
function rankingKey(r: VenueRanking): string {
  return `${r.scope}:${r.continent}:${r.category}:${r.rank}`;
}

export function buildRanking(
  scope: VenueListScope,
  continent: VenueContinent,
  category: Worlds50BestCategory,
  rank: number,
  listUrl: string,
): VenueRanking {
  return { scope, continent, category, rank, listUrl };
}

export function applySeedContext(
  venue: NormalizedVenueGuide,
  seed: {
    continent: VenueContinent;
    listScope: VenueListScope;
    url: string;
    category: Worlds50BestCategory;
  },
  listYear?: number | null,
): NormalizedVenueGuide {
  const ranking = buildRanking(
    seed.listScope,
    seed.continent,
    seed.category,
    venue.worlds50bestRank,
    seed.url,
  );

  const yearField = listYear != null ? { worlds50bestYear: listYear } : {};

  if (seed.listScope === "GLOBAL") {
    return {
      ...venue,
      ...yearField,
      continent: "GLOBAL",
      listScope: "GLOBAL",
      listUrl: seed.url,
      additionalRankings: [ranking],
      enrichmentSource: venue.enrichmentSource ?? "worlds50best",
    };
  }

  return {
    ...venue,
    ...yearField,
    continent: seed.continent,
    listScope: "REGIONAL",
    regionalRank: venue.worlds50bestRank,
    listUrl: seed.url,
    additionalRankings: [ranking],
    enrichmentSource: venue.enrichmentSource ?? "worlds50best",
  };
}

function pickStringArray(existing?: string[], incoming?: string[]): string[] {
  if (incoming?.length) return incoming;
  if (existing?.length) return existing;
  return [];
}

function pickNullable<T>(existing: T | null | undefined, incoming: T | null | undefined): T | null | undefined {
  return incoming ?? existing ?? null;
}

/** Preserva taxonomía y preferencias del registro existente si el incoming viene vacío (p. ej. JSON sin enrich). */
export function mergeVenueGuideDetailFields(
  existing: NormalizedVenueGuide,
  incoming: NormalizedVenueGuide,
): Pick<
  NormalizedVenueGuide,
  | "establishmentTypes"
  | "cuisineTypes"
  | "starDishes"
  | "idealFor"
  | "venueFeatures"
  | "neighborhood"
  | "priceRange"
  | "dailyMenuEnabled"
  | "dailyMenuNote"
  | "awards"
  | "venuePreferences"
  | "instagramUrl"
  | "tiktokUrl"
> {
  return {
    establishmentTypes: pickStringArray(existing.establishmentTypes, incoming.establishmentTypes),
    cuisineTypes: pickStringArray(existing.cuisineTypes, incoming.cuisineTypes),
    starDishes: pickStringArray(existing.starDishes, incoming.starDishes),
    idealFor: pickStringArray(existing.idealFor, incoming.idealFor),
    venueFeatures: pickStringArray(existing.venueFeatures, incoming.venueFeatures),
    neighborhood: pickNullable(existing.neighborhood, incoming.neighborhood) as string | null | undefined,
    priceRange: pickNullable(existing.priceRange, incoming.priceRange) as string | null | undefined,
    dailyMenuEnabled: Boolean(incoming.dailyMenuEnabled || existing.dailyMenuEnabled),
    dailyMenuNote: pickNullable(existing.dailyMenuNote, incoming.dailyMenuNote) as string | null | undefined,
    awards: pickStringArray(existing.awards, incoming.awards),
    venuePreferences: pickStringArray(existing.venuePreferences, incoming.venuePreferences),
    instagramUrl: pickNullable(existing.instagramUrl, incoming.instagramUrl) as string | null | undefined,
    tiktokUrl: pickNullable(existing.tiktokUrl, incoming.tiktokUrl) as string | null | undefined,
  };
}

function pickEnrichmentSource(existing?: string | null, incoming?: string | null): string | null | undefined {
  if (existing && existing !== "worlds50best") return existing;
  return incoming ?? existing;
}

export function mergeVenueGuides(
  existing: NormalizedVenueGuide | undefined,
  incoming: NormalizedVenueGuide,
): NormalizedVenueGuide {
  if (!existing) return enrichGuideFromScrape(incoming);

  const rankings = [...(existing.additionalRankings ?? [])];
  for (const r of incoming.additionalRankings ?? []) {
    if (!rankings.some((x) => rankingKey(x) === rankingKey(r))) {
      rankings.push(r);
    }
  }

  const detail = mergeVenueGuideDetailFields(existing, incoming);

  const merged: NormalizedVenueGuide = {
    ...existing,
    ...detail,
    name: existing.name || incoming.name,
    city: existing.city || incoming.city,
    country: existing.country ?? incoming.country,
    address: existing.address ?? incoming.address,
    photoUrl: existing.photoUrl ?? incoming.photoUrl,
    history: existing.history || incoming.history,
    verdict: existing.verdict || incoming.verdict,
    chefName: existing.chefName || incoming.chefName,
    externalWebsite: existing.externalWebsite || incoming.externalWebsite,
    googleBusinessId: existing.googleBusinessId ?? incoming.googleBusinessId,
    tripadvisorPlaceId: existing.tripadvisorPlaceId ?? incoming.tripadvisorPlaceId,
    tripadvisorUrl: existing.tripadvisorUrl ?? incoming.tripadvisorUrl,
    tripadvisorRating: existing.tripadvisorRating ?? incoming.tripadvisorRating,
    venueCode: existing.venueCode ?? incoming.venueCode,
    worlds50bestRank: existing.worlds50bestRank,
    worlds50bestCategory: existing.worlds50bestCategory,
    worlds50bestYear: existing.worlds50bestYear ?? incoming.worlds50bestYear,
    additionalRankings: rankings,
    enrichmentSource: pickEnrichmentSource(existing.enrichmentSource, incoming.enrichmentSource),
    latitude: existing.latitude ?? incoming.latitude,
    longitude: existing.longitude ?? incoming.longitude,
  };

  if (incoming.listScope === "GLOBAL") {
    merged.worlds50bestRank = incoming.worlds50bestRank;
    merged.listScope = "GLOBAL";
    merged.continent = "GLOBAL";
  }

  if (incoming.listScope === "REGIONAL") {
    const regionalRank = incoming.regionalRank ?? incoming.worlds50bestRank;
    merged.regionalRank =
      merged.regionalRank == null
        ? regionalRank
        : Math.min(merged.regionalRank, regionalRank);
    const hasGlobal =
      merged.listScope === "GLOBAL" ||
      rankings.some((r) => r.scope === "GLOBAL");
    if (!hasGlobal && (!merged.continent || merged.continent === "GLOBAL")) {
      merged.continent = incoming.continent;
    }
  }

  return enrichGuideFromScrape(normalizeCanonicalRegions(merged));
}
