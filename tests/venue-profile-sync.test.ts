import { describe, expect, it } from "vitest";
import {
  applyVenueProfileSync,
  enrichGuideFromScrape,
  mergeDetailFieldArrays,
  syncEstablishmentTypes,
  syncVenuePreferences,
  syncVibeTagsToTaxonomy,
} from "@/lib/venues/venue-profile-sync";
import type { VenuePublicDTO } from "@/lib/venues/types";
import { parseGooglePlaceApiResponse } from "@/lib/venues/enrich-taxonomy-mapper";

describe("venue profile sync", () => {
  it("derives establishmentTypes from legacy venueType", () => {
    expect(syncEstablishmentTypes("cocteleria", [])).toEqual(["cocteleria"]);
    expect(syncEstablishmentTypes("restaurante", ["gastrobar"])).toEqual(["gastrobar"]);
  });

  it("adds dress_code preference when dressCode text exists", () => {
    expect(syncVenuePreferences([], "Smart casual")).toContain("dress_code");
  });

  it("maps vibe tags to taxonomy slugs", () => {
    const synced = syncVibeTagsToTaxonomy(["romántico", "terraza", "custom-tag"], [], []);
    expect(synced.idealFor).toContain("romantico");
    expect(synced.venueFeatures).toContain("terraza_exterior");
    expect(synced.vibeTags).toEqual(["custom-tag"]);
  });

  it("enriches scrape guide with awards and establishment types", () => {
    const guide = enrichGuideFromScrape({
      slug: "demo",
      name: "Demo",
      city: "Madrid",
      venueType: "cocteleria",
      worlds50bestRank: 5,
      worlds50bestCategory: "BARS",
      sourceUrl: "https://example.com",
    });
    expect(guide.establishmentTypes).toEqual(["cocteleria"]);
    expect(guide.awards).toContain("worlds50best");
  });

  it("merges detail arrays without duplicates", () => {
    const merged = mergeDetailFieldArrays(
      { cuisineTypes: ["japonesa"], venuePreferences: ["vegan"] },
      { cuisineTypes: ["espanola"], venuePreferences: ["vegan", "wheelchair"] },
    );
    expect(merged.cuisineTypes).toEqual(["japonesa", "espanola"]);
    expect(merged.venuePreferences).toEqual(["vegan", "wheelchair"]);
  });

  it("applies full sync on public DTO", () => {
    const base = {
      id: "1",
      venueCode: null,
      slug: "demo",
      name: "Demo",
      city: "BCN",
      country: "Spain",
      address: null,
      venueType: "cocteleria",
      photoUrl: null,
      history: null,
      verdict: null,
      foundationYear: null,
      signatureDrink: null,
      dressCode: null,
      vibeTags: [],
      establishmentTypes: [],
      cuisineTypes: [],
      starDishes: [],
      idealFor: [],
      venueFeatures: [],
      neighborhood: null,
      priceRange: null,
      dailyMenuEnabled: false,
      dailyMenuNote: null,
      awards: [],
      venuePreferences: [],
      instagramUrl: null,
      tiktokUrl: null,
      phone: null,
      email: null,
      latitude: null,
      longitude: null,
      source: "editorial" as const,
      worlds50bestRank: 10,
      worlds50bestCategory: "BARS" as const,
      continent: "GLOBAL" as const,
      regionalRank: null,
      additionalRankings: [],
      sourceUrl: null,
      externalWebsite: null,
      googleBusinessId: null,
      tripadvisorUrl: null,
      tripadvisorPlaceId: null,
      tripadvisorRating: null,
      chefName: null,
      reservationProvider: null,
      reservationUrl: null,
      coverManagerUrl: null,
      theForkUrl: null,
      isPremium: false,
      mapPlan: "FREE" as const,
      bookingWidgetEnabled: false,
    } satisfies VenuePublicDTO;

    const synced = applyVenueProfileSync(base);
    expect(synced.establishmentTypes).toEqual(["cocteleria"]);
    expect(synced.awards).toContain("worlds50best");
  });
});

describe("google places parser", () => {
  it("maps Places API response to enrichment input", () => {
    const parsed = parseGooglePlaceApiResponse("ChIJtest", {
      types: ["bar", "restaurant"],
      priceLevel: "PRICE_LEVEL_MODERATE",
      addressComponents: [
        { longText: "Gótico", types: ["neighborhood"] },
      ],
      outdoorSeating: true,
      goodForChildren: true,
      paymentOptions: { acceptsCreditCards: true },
      accessibilityOptions: { wheelchairAccessibleEntrance: true },
    });

    expect(parsed?.types).toContain("bar");
    expect(parsed?.neighborhood).toBe("Gótico");
    expect(parsed?.amenities).toContain("accepts_credit_cards");
    expect(parsed?.features).toContain("outdoor_seating");
  });
});
