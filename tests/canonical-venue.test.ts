import { describe, expect, it } from "vitest";
import {
  mergeVenueSiblings,
  pickCanonicalVenue,
  unifyVenueList,
  venueIdentityKey,
} from "@/lib/venues/canonical-venue";
import { buildRanking } from "@/lib/venues/merge-guide";
import type { NormalizedVenueGuide } from "@/lib/venues/types";

function baseVenue(overrides: Partial<NormalizedVenueGuide> & Pick<NormalizedVenueGuide, "slug" | "sourceUrl">): NormalizedVenueGuide {
  return {
    name: "Bar Leone",
    city: "Hong Kong",
    venueType: "cocteleria",
    worlds50bestRank: 1,
    worlds50bestCategory: "BARS",
    listScope: "GLOBAL",
    continent: "GLOBAL",
    ...overrides,
  };
}

describe("canonical venue", () => {
  it("builds identity key from name, city and category", () => {
    const venue = baseVenue({ slug: "bar-leone", sourceUrl: "https://example.com/a" });
    expect(venueIdentityKey(venue)).toContain("bar-leone");
    expect(venueIdentityKey(venue)).toContain("::BARS");
  });

  it("prefers global list entry as canonical", () => {
    const global = baseVenue({
      slug: "bar-leone",
      sourceUrl: "https://example.com/global",
      listScope: "GLOBAL",
    });
    const regional = baseVenue({
      slug: "bar-leone-2",
      sourceUrl: "https://example.com/asia",
      listScope: "REGIONAL",
      continent: "ASIA",
      regionalRank: 1,
      additionalRankings: [
        buildRanking("REGIONAL", "ASIA", "BARS", 1, "https://example.com/asia-list"),
      ],
    });

    expect(pickCanonicalVenue([regional, global]).slug).toBe("bar-leone");
  });

  it("merges siblings preserving regional rankings", () => {
    const global = baseVenue({
      slug: "bar-leone",
      sourceUrl: "https://example.com/global",
      additionalRankings: [
        buildRanking("GLOBAL", "GLOBAL", "BARS", 1, "https://example.com/global-list"),
      ],
    });
    const regional = baseVenue({
      slug: "bar-leone-2",
      sourceUrl: "https://example.com/asia",
      listScope: "REGIONAL",
      continent: "ASIA",
      regionalRank: 1,
      additionalRankings: [
        buildRanking("REGIONAL", "ASIA", "BARS", 1, "https://example.com/asia-list"),
      ],
    });

    const merged = mergeVenueSiblings([global, regional]);
    expect(merged.slug).toBe("bar-leone");
    expect(merged.additionalRankings?.length).toBeGreaterThanOrEqual(2);
    expect(merged.regionalRank).toBe(1);
  });

  it("merges taxonomy from richer sibling", () => {
    const global = baseVenue({
      slug: "sips",
      sourceUrl: "https://example.com/global",
      name: "Sips",
      city: "Barcelona",
    });
    const enriched = baseVenue({
      slug: "sips-2",
      sourceUrl: "https://example.com/europe",
      name: "Sips",
      city: "Barcelona",
      listScope: "REGIONAL",
      continent: "EUROPE",
      venuePreferences: ["vegan", "wheelchair"],
      tripadvisorUrl: "https://tripadvisor.example/sips",
    });

    const merged = mergeVenueSiblings([global, enriched]);
    expect(merged.venuePreferences).toEqual(["vegan", "wheelchair"]);
    expect(merged.tripadvisorUrl).toContain("tripadvisor");
  });

  it("unifyVenueList collapses duplicate identity groups", () => {
    const venues = [
      baseVenue({ slug: "bar-leone", sourceUrl: "https://example.com/a" }),
      baseVenue({
        slug: "bar-leone-2",
        sourceUrl: "https://example.com/b",
        listScope: "REGIONAL",
        continent: "ASIA",
      }),
      baseVenue({
        slug: "paradiso",
        sourceUrl: "https://example.com/c",
        name: "Paradiso",
        city: "Bangkok",
      }),
    ];

    const { venues: unified, merges, identityMergeCount } = unifyVenueList(venues);
    expect(unified).toHaveLength(2);
    expect(identityMergeCount).toBe(1);
    expect(merges[0].mergedSlugs).toContain("bar-leone-2");
  });
});
