import { describe, expect, it } from "vitest";
import { buildRanking } from "@/lib/venues/merge-guide";
import { normalizeCanonicalRegions, buildRegionTags, primaryIndexContinent } from "@/lib/venues/region-tags";
import type { NormalizedVenueGuide } from "@/lib/venues/types";

function baseVenue(overrides: Partial<NormalizedVenueGuide>): NormalizedVenueGuide {
  return {
    slug: "sips-2",
    name: "Sips",
    city: "Barcelona",
    venueType: "cocteleria",
    worlds50bestRank: 3,
    worlds50bestCategory: "BARS",
    sourceUrl: "https://example.com/sips",
    listScope: "GLOBAL",
    continent: "EUROPE",
    additionalRankings: [
      buildRanking("GLOBAL", "GLOBAL", "BARS", 3, "https://example.com/global"),
      buildRanking("REGIONAL", "EUROPE", "BARS", 1, "https://example.com/europe"),
    ],
    ...overrides,
  };
}

describe("normalizeCanonicalRegions", () => {
  it("keeps continent GLOBAL when global ranking exists", () => {
    const normalized = normalizeCanonicalRegions(baseVenue({}));
    expect(normalized.continent).toBe("GLOBAL");
    expect(normalized.listScope).toBe("GLOBAL");
    expect(normalized.regionalRank).toBe(1);
  });

  it("builds region tags from regional rankings only", () => {
    const tags = buildRegionTags(baseVenue({}).additionalRankings, "BARS");
    expect(tags[0]).toContain("#1");
    expect(tags[0]).toContain("Europe");
  });

  it("assigns primary index continent exclusively", () => {
    expect(
      primaryIndexContinent("GLOBAL", baseVenue({}).additionalRankings),
    ).toBe("GLOBAL");
    expect(
      primaryIndexContinent(
        "ASIA",
        [buildRanking("REGIONAL", "ASIA", "BARS", 2, "https://example.com/asia")],
      ),
    ).toBe("ASIA");
  });
});
