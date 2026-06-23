import { describe, expect, it } from "vitest";
import {
  compareEditorialIndexVenues,
  filterEditorialIndexVenues,
  matchesMapVenueSearch,
  sortEditorialIndexVenues,
} from "@/lib/venues/sort-editorial-index";

const bar2 = {
  slug: "bar-two",
  name: "Bar Two",
  city: "Madrid",
  worlds50bestRank: 2,
  worlds50bestCategory: "BARS",
  listScope: "GLOBAL",
  regionalRank: null,
  regionTags: ["Europe"],
};

const restaurant1 = {
  slug: "restaurant-one",
  name: "Restaurant One",
  city: "Paris",
  worlds50bestRank: 1,
  worlds50bestCategory: "RESTAURANTS",
  listScope: "GLOBAL",
  regionalRank: null,
  regionTags: ["Europe"],
};

const regionalBar2 = {
  slug: "regional-bar",
  name: "Regional Bar",
  city: "NYC",
  worlds50bestRank: 2,
  worlds50bestCategory: "BARS",
  listScope: "REGIONAL",
  regionalRank: 2,
};

const bar1Alpha = {
  slug: "bar-alpha",
  name: "Alpha Bar",
  city: "London",
  worlds50bestRank: 1,
  worlds50bestCategory: "BARS",
  listScope: "GLOBAL",
  regionalRank: null,
};

const bar1Beta = {
  slug: "bar-beta",
  name: "Beta Bar",
  city: "London",
  worlds50bestRank: 1,
  worlds50bestCategory: "BARS",
  listScope: "GLOBAL",
  regionalRank: null,
};

describe("sort-editorial-index", () => {
  it("orders BARS before RESTAURANTS even when restaurant has lower rank number", () => {
    expect(compareEditorialIndexVenues(bar2, restaurant1)).toBeLessThan(0);
    const sorted = sortEditorialIndexVenues([restaurant1, bar2]);
    expect(sorted.map((v) => v.slug)).toEqual(["bar-two", "restaurant-one"]);
  });

  it("orders GLOBAL venues before REGIONAL at same rank number", () => {
    const sorted = sortEditorialIndexVenues([regionalBar2, bar2]);
    expect(sorted.map((v) => v.slug)).toEqual(["bar-two", "regional-bar"]);
  });

  it("breaks ties on same rank and category by name", () => {
    const sorted = sortEditorialIndexVenues([bar1Beta, bar1Alpha]);
    expect(sorted.map((v) => v.slug)).toEqual(["bar-alpha", "bar-beta"]);
  });

  it("filters by city and name (accent-insensitive)", () => {
    const venues = [
      bar1Alpha,
      {
        ...bar2,
        name: "Sips",
        city: "Barcelona",
        slug: "sips-barcelona",
      },
    ];
    expect(filterEditorialIndexVenues(venues, "barcelona").map((v) => v.slug)).toEqual([
      "sips-barcelona",
    ]);
    expect(filterEditorialIndexVenues(venues, "sips").map((v) => v.slug)).toEqual([
      "sips-barcelona",
    ]);
  });

  it("filters map pins by name, city or category", () => {
    const pin = {
      name: "Sips",
      city: "Barcelona",
      slug: "sips-barcelona",
      worlds50bestCategory: "BARS",
    };
    expect(matchesMapVenueSearch(pin, "sips")).toBe(true);
    expect(matchesMapVenueSearch(pin, "bars")).toBe(true);
    expect(matchesMapVenueSearch(pin, "madrid")).toBe(false);
    expect(matchesMapVenueSearch(pin, "")).toBe(true);
  });
});
