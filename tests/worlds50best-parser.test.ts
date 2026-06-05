import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { parseDetailPage, parseListPage } from "@/lib/venues/worlds50best-parser";

const fixtures = path.join(process.cwd(), "tests/fixtures/w50best");

describe("worlds50best parser", () => {
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
      detailPath: "/bars/the-list/bar-leone.html",
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
    expect(venue.verdict).toContain("Opened in June 2023");
    expect(venue.worlds50bestCategory).toBe("BARS");
    expect(venue.venueType).toBe("cocteleria");
  });
});
