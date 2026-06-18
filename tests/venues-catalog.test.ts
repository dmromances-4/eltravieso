import { describe, expect, it } from "vitest";
import { barToPublicDTO, guideToPublicDTO } from "@/lib/venues/catalog";
import { mergeVenueGuides, buildRanking } from "@/lib/venues/merge-guide";
import type { NormalizedVenueGuide } from "@/lib/venues/types";

const baseGuide: NormalizedVenueGuide = {
  slug: "sips",
  name: "Sips",
  city: "Barcelona",
  country: "Spain",
  venueType: "cocteleria",
  worlds50bestRank: 3,
  worlds50bestCategory: "BARS",
  sourceUrl: "https://www.theworlds50best.com/bars/the-list/sips.html",
  continent: "GLOBAL",
  listScope: "GLOBAL",
  additionalRankings: [
    buildRanking("GLOBAL", "GLOBAL", "BARS", 3, "https://www.theworlds50best.com/bars/list/1-50"),
  ],
};

describe("venues catalog DTOs", () => {
  it("maps guide entry to public DTO with regional fields", () => {
    const dto = guideToPublicDTO({
      id: "g1",
      venueCode: "ET-LOC-00001",
      slug: "sips",
      name: "Sips",
      city: "Barcelona",
      country: "Spain",
      address: "Carrer de Muntaner, 108",
      venueType: "cocteleria",
      photoUrl: null,
      history: "Historia",
      verdict: "Veredicto",
      chefName: null,
      latitude: 41.39,
      longitude: 2.16,
      worlds50bestRank: 3,
      worlds50bestCategory: "BARS",
      continent: "GLOBAL",
      listScope: "GLOBAL",
      regionalRank: 2,
      additionalRankings: [
        buildRanking("REGIONAL", "EUROPE", "BARS", 2, "https://example.com/europe"),
      ],
      sourceUrl: baseGuide.sourceUrl,
      externalWebsite: null,
      googleBusinessId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
      tripadvisorUrl: "https://www.tripadvisor.es/Restaurant_Review-sips",
      tripadvisorPlaceId: "d12345678",
      tripadvisorRating: 4.5,
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
      geocodeConfidence: null,
      isPublished: true,
      barProfileId: null,
      source: "WORLDS_50_BEST",
      worlds50bestYear: null,
      enrichmentSource: "worlds50best",
      scrapedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(dto.slug).toBe("sips");
    expect(dto.venueCode).toBe("ET-LOC-00001");
    expect(dto.googleBusinessId).toContain("ChIJ");
    expect(dto.tripadvisorPlaceId).toBe("d12345678");
    expect(dto.regionalRank).toBe(2);
    expect(dto.additionalRankings).toHaveLength(1);
    expect(dto.tripadvisorUrl).toContain("tripadvisor");
    expect(dto.establishmentTypes).toEqual([]);
    expect(dto.dailyMenuEnabled).toBe(false);
  });

  it("returns null for affiliate bar without slug", () => {
    const dto = barToPublicDTO({
      id: "b1",
      slug: null,
      businessName: "Demo",
      city: "Madrid",
      country: "Spain",
      address: null,
      venueType: "bar",
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
      tripadvisorUrl: null,
      phone: null,
      email: null,
      latitude: null,
      longitude: null,
      reservationProvider: null,
      reservationUrl: null,
      coverManagerUrl: null,
      theForkUrl: null,
      isPremium: true,
      mapPlan: "FEATURED",
      bookingWidgetEnabled: true,
      guideEntry: null,
    } as never);
    expect(dto).toBeNull();
  });

  it("maps premium affiliate fields", () => {
    const dto = barToPublicDTO({
      id: "b2",
      slug: "bar-demo",
      businessName: "Bar Demo",
      city: "Madrid",
      country: "Spain",
      address: "Calle 1",
      venueType: "bar",
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
      tripadvisorUrl: null,
      phone: null,
      email: null,
      latitude: null,
      longitude: null,
      reservationProvider: "COVER_MANAGER",
      reservationUrl: "https://covermanager.com/embed",
      coverManagerUrl: null,
      theForkUrl: null,
      isPremium: true,
      mapPlan: "FEATURED",
      bookingWidgetEnabled: true,
      guideEntry: null,
    } as never);

    expect(dto?.isPremium).toBe(true);
    expect(dto?.mapPlan).toBe("FEATURED");
  });
});

describe("merge rankings", () => {
  it("merges regional ranking into global venue", () => {
    const regional: NormalizedVenueGuide = {
      ...baseGuide,
      continent: "ASIA",
      listScope: "REGIONAL",
      regionalRank: 2,
      worlds50bestRank: 2,
      additionalRankings: [
        buildRanking("REGIONAL", "ASIA", "BARS", 2, "https://www.theworlds50best.com/bars/asia/list/1-50"),
      ],
    };

    const merged = mergeVenueGuides(baseGuide, regional);
    expect(merged.worlds50bestRank).toBe(3);
    expect(merged.regionalRank).toBe(2);
    expect(merged.additionalRankings?.length).toBeGreaterThanOrEqual(2);
  });
});
