import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { parseDetailPage, parseListPage, parseListYear, dedupeSlugs } from "@/lib/venues/worlds50best-parser";
import type { NormalizedVenueGuide } from "@/lib/venues/types";

const fixtures = path.join(process.cwd(), "tests/fixtures/w50best");

describe("worlds50best parser", () => {
  it("extracts list year from og:title", () => {
    const html = fs.readFileSync(path.join(fixtures, "list-bars-snippet.html"), "utf-8");
    expect(parseListYear(html)).toBe(2025);
  });

  it("filters list items by maxRank", () => {
    const html = fs.readFileSync(path.join(fixtures, "list-bars-snippet.html"), "utf-8");
    const items = parseListPage(html, "https://www.theworlds50best.com", { maxRank: 50 });
    expect(items.every((i) => i.rank <= 50)).toBe(true);
  });

  it("parses list items from bars HTML", () => {
    const html = fs.readFileSync(path.join(fixtures, "list-bars-snippet.html"), "utf-8");
    const items = parseListPage(html, "https://www.theworlds50best.com");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      rank: 1,
      name: "Bar Leone",
      city: "Hong Kong",
      detailPath: "/bars/best-in-the-world/the-list/bar-leone.html",
    });
  });

  it("parses detail page for a bar", () => {
    const listHtml = fs.readFileSync(path.join(fixtures, "list-bars-snippet.html"), "utf-8");
    const detailHtml = fs.readFileSync(path.join(fixtures, "detail-bar-snippet.html"), "utf-8");
    const [item] = parseListPage(listHtml, "https://www.theworlds50best.com");
    const venue = parseDetailPage(detailHtml, item, "BARS", "https://www.theworlds50best.com");

    expect(venue.slug).toBe("bar-leone");
    expect(venue.name).toBe("Bar Leone");
    expect(venue.address).toContain("Hong Kong");
    expect(venue.externalWebsite).toBe("https://www.barleonehk.com/");
    expect(venue.verdict).toContain("timeless Italian drinking culture");
    expect(venue.history).toContain("Opened in June 2023");
    expect(venue.worlds50bestCategory).toBe("BARS");
    expect(venue.venueType).toBe("cocteleria");
  });

  it("parses detail page with article attribute before class", () => {
    const detailHtml = fs.readFileSync(
      path.join(fixtures, "detail-bar-live-snippet.html"),
      "utf-8",
    );
    const item = {
      rank: 3,
      name: "Sips",
      city: "Barcelona",
      detailPath: "/bars/best-in-the-world/the-list/sips.html",
      imageUrl: null,
    };
    const venue = parseDetailPage(detailHtml, item, "BARS", "https://www.theworlds50best.com");
    expect(venue.verdict).toContain("immersive cocktail journey");
    expect(venue.history).toContain("Opened in 2021");
    expect(venue.externalWebsite).toBe("http://sips.barcelona/");
  });

  it("parses detail page for a restaurant with chef", () => {
    const detailHtml = fs.readFileSync(path.join(fixtures, "detail-restaurant-snippet.html"), "utf-8");
    const item = {
      rank: 1,
      name: "Geranium",
      city: "Copenhagen",
      detailPath: "/the-list/geranium.html",
      imageUrl: null,
    };
    const venue = parseDetailPage(detailHtml, item, "RESTAURANTS", "https://www.theworlds50best.com");

    expect(venue.chefName).toBe("Rasmus Kofoed");
    expect(venue.externalWebsite).toBe("https://www.geranium.dk/");
    expect(venue.verdict).toContain("Nordic cuisine");
  });
});

function minimalGuide(overrides: Partial<NormalizedVenueGuide> & Pick<NormalizedVenueGuide, "slug" | "sourceUrl">): NormalizedVenueGuide {
  return {
    name: "Test",
    city: "City",
    venueType: "cocteleria",
    worlds50bestRank: 1,
    worlds50bestCategory: "BARS",
    ...overrides,
  };
}

describe("dedupeSlugs", () => {
  it("assigns numeric suffixes on collision instead of stacking category suffix", () => {
    const venues = dedupeSlugs([
      minimalGuide({ slug: "maido-restaurant", sourceUrl: "https://example.com/a", worlds50bestCategory: "RESTAURANTS" }),
      minimalGuide({ slug: "maido-restaurant", sourceUrl: "https://example.com/b", worlds50bestCategory: "RESTAURANTS" }),
      minimalGuide({ slug: "maido-restaurant", sourceUrl: "https://example.com/c", worlds50bestCategory: "RESTAURANTS" }),
    ]);

    expect(venues.map((v) => v.slug)).toEqual([
      "maido-restaurant",
      "maido-restaurant-2",
      "maido-restaurant-3",
    ]);
  });

  it("keeps unique slugs unchanged", () => {
    const venues = dedupeSlugs([
      minimalGuide({ slug: "bar-leone", sourceUrl: "https://example.com/a" }),
      minimalGuide({ slug: "sips", sourceUrl: "https://example.com/b" }),
    ]);
    expect(venues[0].slug).toBe("bar-leone");
    expect(venues[1].slug).toBe("sips");
  });

  it("never produces double category suffixes", () => {
    const venues = dedupeSlugs([
      minimalGuide({ slug: "coa-bar", sourceUrl: "https://example.com/a" }),
      minimalGuide({ slug: "coa-bar", sourceUrl: "https://example.com/b" }),
    ]);
    expect(venues[1].slug).toBe("coa-bar-2");
    expect(venues.some((v) => /-(bar|restaurant)-(bar|restaurant)/.test(v.slug))).toBe(false);
  });
});
