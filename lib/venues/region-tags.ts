import type { VenueContinent, Worlds50BestCategory } from "@prisma/client";
import { CONTINENT_LABELS, REGIONAL_LIST_LABELS } from "@/lib/venues/continents";
import type { NormalizedVenueGuide, VenueRanking } from "@/lib/venues/types";
import { parseAdditionalRankings } from "@/lib/venues/types";

function rankingKey(r: VenueRanking): string {
  return `${r.scope}:${r.continent}:${r.category}:${r.rank}`;
}

/** Normaliza continente tras unificar global + regional: global gana; regional solo en tags. */
export function normalizeCanonicalRegions(venue: NormalizedVenueGuide): NormalizedVenueGuide {
  const rankings = [...(venue.additionalRankings ?? [])];
  const hasGlobalRanking = rankings.some((r) => r.scope === "GLOBAL");
  const hasGlobalScope = venue.listScope === "GLOBAL" || hasGlobalRanking;

  const regionalRankings = rankings.filter((r) => r.scope === "REGIONAL");
  const bestRegional =
    regionalRankings.length > 0
      ? Math.min(...regionalRankings.map((r) => r.rank))
      : venue.regionalRank ?? null;

  const deduped = rankings.filter(
    (r, i, arr) => arr.findIndex((x) => rankingKey(x) === rankingKey(r)) === i,
  );

  return {
    ...venue,
    listScope: hasGlobalScope ? "GLOBAL" : (venue.listScope ?? "REGIONAL"),
    continent: hasGlobalScope
      ? "GLOBAL"
      : (regionalRankings[0]?.continent ?? venue.continent ?? "GLOBAL"),
    regionalRank: bestRegional,
    additionalRankings: deduped,
  };
}

export function buildRegionTags(
  additionalRankings: unknown,
  category?: Worlds50BestCategory | null,
): string[] {
  const regional = parseAdditionalRankings(additionalRankings).filter((r) => r.scope === "REGIONAL");
  const seen = new Set<string>();

  return regional
    .sort((a, b) => a.rank - b.rank)
    .map((r) => {
      const label =
        REGIONAL_LIST_LABELS[r.continent]?.[r.category ?? category ?? "BARS"] ??
        CONTINENT_LABELS[r.continent as VenueContinent] ??
        r.continent;
      return `#${r.rank} ${label}`;
    })
    .filter((tag) => {
      if (seen.has(tag)) return false;
      seen.add(tag);
      return true;
    });
}

/** Sección única del índice editorial: global si tiene ranking global; si no, su continente regional. */
export function primaryIndexContinent(
  continent: VenueContinent | null,
  additionalRankings: unknown,
): VenueContinent {
  const rankings = parseAdditionalRankings(additionalRankings);
  if (rankings.some((r) => r.scope === "GLOBAL") || continent === "GLOBAL") {
    return "GLOBAL";
  }
  const regional = rankings.find((r) => r.scope === "REGIONAL");
  if (regional) return regional.continent;
  return continent ?? "GLOBAL";
}
