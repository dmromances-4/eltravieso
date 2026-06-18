import { describe, expect, it } from "vitest";
import {
  parseEstablishmentTypes,
  parsePriceRange,
  parseStarDishes,
  parseVenuePreferences,
  normalizeSocialHandle,
  normalizeTikTokHandle,
} from "@/lib/venues/taxonomy";
import { parseVenueDetailFields } from "@/lib/venues/venue-detail-fields";
import { mergeVenueDetailFields } from "@/lib/venues/venue-detail-merge";
import { mapTripAdvisorEnrichment } from "@/lib/venues/enrich-taxonomy-mapper";

describe("venue taxonomy", () => {
  it("filters unknown establishment types", () => {
    expect(parseEstablishmentTypes(["cocteleria", "invalid", "bar"])).toEqual([
      "cocteleria",
      "bar",
    ]);
  });

  it("parses star dishes up to five items", () => {
    expect(parseStarDishes("Paella, croquetas, jamón, pulpo, tarta, extra")).toEqual([
      "Paella",
      "croquetas",
      "jamón",
      "pulpo",
      "tarta",
    ]);
  });

  it("validates price range ids", () => {
    expect(parsePriceRange("range_15_30")).toBe("range_15_30");
    expect(parsePriceRange("cheap")).toBeNull();
  });

  it("accepts dress_code preference", () => {
    expect(parseVenuePreferences(["vegan", "dress_code", "nope"])).toEqual([
      "vegan",
      "dress_code",
    ]);
  });

  it("normalizes social handles", () => {
    expect(normalizeSocialHandle("@ellocal")).toBe("https://instagram.com/ellocal");
    expect(normalizeTikTokHandle("@ellocal")).toBe("https://www.tiktok.com/@ellocal");
  });
});

describe("venue detail merge", () => {
  it("prefers bar arrays when non-empty", () => {
    const merged = mergeVenueDetailFields(
      { cuisineTypes: ["japonesa"] },
      { cuisineTypes: ["mediterranea"], neighborhood: "Gótico" },
    );
    expect(merged.cuisineTypes).toEqual(["japonesa"]);
    expect(merged.neighborhood).toBe("Gótico");
  });
});

describe("tripadvisor taxonomy mapper", () => {
  it("maps price level and amenities to slugs", () => {
    const mapped = mapTripAdvisorEnrichment({
      priceLevel: 2,
      cuisineLabels: ["japanese"],
      amenities: ["wheelchair_accessible", "vegan_options"],
    });
    expect(mapped.priceRange).toBe("range_15_30");
    expect(mapped.cuisineTypes).toContain("japonesa");
    expect(mapped.venuePreferences).toContain("wheelchair");
    expect(mapped.venuePreferences).toContain("vegan");
  });
});

describe("parseVenueDetailFields", () => {
  it("maps body to persisted shape", () => {
    const parsed = parseVenueDetailFields({
      establishmentTypes: ["restaurante"],
      dailyMenuEnabled: true,
      dailyMenuNote: "12€",
      instagramUrl: "@demo",
    });
    expect(parsed.establishmentTypes).toEqual(["restaurante"]);
    expect(parsed.dailyMenuEnabled).toBe(true);
    expect(parsed.instagramUrl).toContain("instagram.com");
  });
});
