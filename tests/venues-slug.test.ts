import { describe, expect, it } from "vitest";
import { slugFromDetailPath, normalizeVenueKey } from "@/lib/venues/unique-slug";
import { slugify } from "@/lib/utils/slug";

describe("venue slug helpers", () => {
  it("derives slug from bar detail path", () => {
    expect(slugFromDetailPath("/bars/the-list/bar-leone.html", "BARS")).toBe("bar-leone");
  });

  it("adds restaurant suffix for restaurant paths", () => {
    expect(slugFromDetailPath("/the-list/maido.html", "RESTAURANTS")).toBe("maido-restaurant");
  });

  it("normalizes venue match keys", () => {
    expect(normalizeVenueKey("Sips", "Barcelona")).toBe(`${slugify("Sips")}::${slugify("Barcelona")}`);
  });
});
