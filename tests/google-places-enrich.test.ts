import { describe, expect, it } from "vitest";
import {
  parseGooglePlaceApiResponse,
  parseGooglePlaceSearchResult,
} from "@/lib/venues/enrich-taxonomy-mapper";
import {
  buildGoogleVenueUpdate,
  normalizeGooglePlaceId,
} from "@/lib/venues/enrich-google-places";
import {
  googlePlacesAutoMinScore,
  scorePlaceMatch,
} from "@/lib/venues/google-place-match";

describe("normalizeGooglePlaceId", () => {
  it("strips places/ prefix", () => {
    expect(normalizeGooglePlaceId("places/ChIJabc123")).toBe("ChIJabc123");
    expect(normalizeGooglePlaceId("ChIJabc123")).toBe("ChIJabc123");
  });
});

describe("parseGooglePlaceApiResponse", () => {
  it("maps extended Places API fields", () => {
    const parsed = parseGooglePlaceApiResponse("ChIJtest", {
      types: ["bar"],
      primaryType: "restaurant",
      priceLevel: "PRICE_LEVEL_MODERATE",
      formattedAddress: "Carrer de la Pau 1, Barcelona",
      location: { latitude: 41.38, longitude: 2.17 },
      websiteUri: "https://example.com",
      addressComponents: [{ longText: "Gótico", types: ["neighborhood"] }],
      outdoorSeating: true,
      paymentOptions: { acceptsCreditCards: true },
    });

    expect(parsed?.primaryType).toBe("restaurant");
    expect(parsed?.formattedAddress).toContain("Barcelona");
    expect(parsed?.latitude).toBe(41.38);
    expect(parsed?.websiteUri).toBe("https://example.com");
    expect(parsed?.neighborhood).toBe("Gótico");
  });
});

describe("parseGooglePlaceSearchResult", () => {
  it("parses searchText candidate", () => {
    const parsed = parseGooglePlaceSearchResult({
      id: "places/ChIJsearch",
      displayName: { text: "Sips Bar" },
      formattedAddress: "Carrer Nou, Barcelona, España",
      location: { latitude: 41.39, longitude: 2.16 },
      types: ["bar"],
      googleMapsUri: "https://maps.google.com/?cid=1",
    });

    expect(parsed?.placeId).toBe("ChIJsearch");
    expect(parsed?.displayName).toBe("Sips Bar");
    expect(parsed?.googleMapsUri).toContain("maps.google.com");
  });
});

describe("scorePlaceMatch", () => {
  const venue = {
    name: "Sips",
    city: "Barcelona",
    country: "España",
    latitude: 41.385,
    longitude: 2.173,
    venueType: "cocteleria",
  };

  it("scores a strong match highly", () => {
    const score = scorePlaceMatch(venue, {
      placeId: "ChIJ1",
      displayName: "Sips Bar",
      formattedAddress: "Barcelona, España",
      latitude: 41.3851,
      longitude: 2.1731,
      types: ["bar"],
    });
    expect(score).toBeGreaterThanOrEqual(0.88);
  });

  it("scores a wrong city lower", () => {
    const score = scorePlaceMatch(venue, {
      placeId: "ChIJ2",
      displayName: "Sips",
      formattedAddress: "Madrid, España",
      latitude: 40.41,
      longitude: -3.7,
      types: ["bar"],
    });
    expect(score).toBeLessThan(0.88);
  });
});

describe("buildGoogleVenueUpdate", () => {
  it("fills only missing scalar fields", () => {
    const update = buildGoogleVenueUpdate(
      {
        googleBusinessId: "ChIJexisting",
        address: "Dirección editorial",
        latitude: 41.0,
        longitude: 2.0,
        geocodeConfidence: "high",
        externalWebsite: "https://editorial.com",
        neighborhood: null,
        priceRange: null,
        establishmentTypes: [],
        venuePreferences: [],
        venueFeatures: [],
        awards: [],
      },
      {
        placeId: "ChIJexisting",
        formattedAddress: "Otra dirección",
        latitude: 41.5,
        longitude: 2.5,
        websiteUri: "https://google.com",
        types: ["bar"],
        amenities: ["accepts_credit_cards"],
        features: ["outdoor_seating"],
      },
    );

    expect(update.address).toBe("Dirección editorial");
    expect(update.externalWebsite).toBe("https://editorial.com");
    expect(update.latitude).toBe(41.0);
    expect(update.establishmentTypes).toContain("bar");
    expect(update.venueFeatures).toContain("terraza_exterior");
  });

  it("fills coords when missing or low confidence", () => {
    const update = buildGoogleVenueUpdate(
      {
        googleBusinessId: null,
        address: null,
        latitude: null,
        longitude: null,
        geocodeConfidence: "low",
        externalWebsite: null,
        establishmentTypes: [],
        venuePreferences: [],
        venueFeatures: [],
        awards: [],
      },
      {
        placeId: "places/ChIJnew",
        formattedAddress: "Barcelona",
        latitude: 41.39,
        longitude: 2.16,
        types: ["restaurant"],
      },
      { assignPlaceId: true },
    );

    expect(update.googleBusinessId).toBe("ChIJnew");
    expect(update.latitude).toBe(41.39);
    expect(update.geocodeConfidence).toBe("high");
  });
});

describe("googlePlacesAutoMinScore", () => {
  it("defaults to 0.88", () => {
    const prev = process.env.GOOGLE_PLACES_AUTO_MIN_SCORE;
    delete process.env.GOOGLE_PLACES_AUTO_MIN_SCORE;
    expect(googlePlacesAutoMinScore()).toBe(0.88);
    process.env.GOOGLE_PLACES_AUTO_MIN_SCORE = prev;
  });
});
