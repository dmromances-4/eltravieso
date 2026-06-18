import { describe, expect, it } from "vitest";
import { dedupeMapVenues } from "@/lib/venues/map-dedup";
import type { MapVenueDTO } from "@/lib/venues/types";

function venue(partial: Partial<MapVenueDTO> & Pick<MapVenueDTO, "id" | "slug" | "layer">): MapVenueDTO {
  return {
    name: partial.name ?? partial.slug,
    latitude: partial.latitude ?? 41.38,
    longitude: partial.longitude ?? 2.17,
    city: partial.city ?? "Barcelona",
    venueType: partial.venueType ?? "cocteleria",
    venueCode: partial.venueCode ?? null,
    geocodeConfidence: partial.geocodeConfidence ?? "high",
    address: partial.address ?? null,
    photoUrl: partial.photoUrl ?? null,
    profileUrl: partial.profileUrl ?? `/locales/${partial.slug}`,
    worlds50bestRank: partial.worlds50bestRank ?? null,
    continent: partial.continent ?? null,
    regionalRank: partial.regionalRank ?? null,
    ...partial,
  };
}

describe("dedupeMapVenues", () => {
  it("drops editorial when affiliate shares slug", () => {
    const affiliates = [venue({ id: "b1", slug: "paradiso", layer: "affiliate", venueCode: "ET-LOC-00001" })];
    const editorial = [venue({ id: "g1", slug: "paradiso", layer: "editorial", venueCode: "ET-LOC-00001" })];
    const result = dedupeMapVenues(affiliates, editorial);
    expect(result).toHaveLength(1);
    expect(result[0].layer).toBe("affiliate");
  });

  it("dedupes by venueCode when slugs differ", () => {
    const affiliates = [venue({ id: "b1", slug: "bar-a", layer: "affiliate", venueCode: "ET-LOC-00002" })];
    const editorial = [venue({ id: "g1", slug: "guide-a", layer: "editorial", venueCode: "ET-LOC-00002" })];
    const result = dedupeMapVenues(affiliates, editorial);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b1");
  });
});
