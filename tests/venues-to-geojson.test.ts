import { describe, expect, it } from "vitest";
import { venuesToGeoJson } from "@/components/map/venuesToGeoJson";
import type { MapVenueDTO } from "@/lib/venues/types";

const sample: MapVenueDTO = {
  id: "v1",
  venueCode: "ET-LOC-00001",
  slug: "test-bar",
  name: "Test Bar",
  latitude: 40.4,
  longitude: -3.7,
  city: "Madrid",
  address: null,
  photoUrl: null,
  profileUrl: "/locales/test-bar",
  venueType: "BAR",
  layer: "editorial",
  worlds50bestRank: 5,
  continent: "EUROPE",
  regionalRank: null,
  isPremium: true,
  geocodeConfidence: "high",
};

describe("venuesToGeoJson", () => {
  it("converts venues to FeatureCollection", () => {
    const fc = venuesToGeoJson([sample]);
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0]?.geometry.coordinates).toEqual([-3.7, 40.4]);
    expect(fc.features[0]?.properties?.slug).toBe("test-bar");
    expect(fc.features[0]?.properties?.isPremium).toBe(true);
  });

  it("returns empty collection for empty input", () => {
    const fc = venuesToGeoJson([]);
    expect(fc.features).toHaveLength(0);
  });
});
