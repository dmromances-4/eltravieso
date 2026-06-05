import type { VenueContinent, VenueListScope, Worlds50BestCategory } from "@prisma/client";
import type { NormalizedVenueGuide, VenueRanking } from "@/lib/venues/types";

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
): NormalizedVenueGuide {
  const ranking = buildRanking(
    seed.listScope,
    seed.continent,
    seed.category,
    venue.worlds50bestRank,
    seed.url,
  );

  if (seed.listScope === "GLOBAL") {
    return {
      ...venue,
      continent: "GLOBAL",
      listScope: "GLOBAL",
      listUrl: seed.url,
      additionalRankings: [ranking],
      enrichmentSource: venue.enrichmentSource ?? "worlds50best",
    };
  }

  return {
    ...venue,
    continent: seed.continent,
    listScope: "REGIONAL",
    regionalRank: venue.worlds50bestRank,
    listUrl: seed.url,
    additionalRankings: [ranking],
    enrichmentSource: venue.enrichmentSource ?? "worlds50best",
  };
}

export function mergeVenueGuides(
  existing: NormalizedVenueGuide | undefined,
  incoming: NormalizedVenueGuide,
): NormalizedVenueGuide {
  if (!existing) return { ...incoming };

  const rankings = [...(existing.additionalRankings ?? [])];
  for (const r of incoming.additionalRankings ?? []) {
    if (!rankings.some((x) => rankingKey(x) === rankingKey(r))) {
      rankings.push(r);
    }
  }

  const merged: NormalizedVenueGuide = {
    ...existing,
    name: existing.name || incoming.name,
    city: existing.city || incoming.city,
    country: existing.country ?? incoming.country,
    address: existing.address ?? incoming.address,
    photoUrl: existing.photoUrl ?? incoming.photoUrl,
    history: existing.history ?? incoming.history,
    verdict: existing.verdict ?? incoming.verdict,
    chefName: existing.chefName ?? incoming.chefName,
    externalWebsite: existing.externalWebsite ?? incoming.externalWebsite,
    additionalRankings: rankings,
    enrichmentSource: existing.enrichmentSource ?? incoming.enrichmentSource,
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
    if (!merged.continent || merged.continent === "GLOBAL") {
      merged.continent = incoming.continent;
    }
  }

  return merged;
}
