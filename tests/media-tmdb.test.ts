import { describe, expect, it } from "vitest";
import { tmdbPosterUrl, yearFromDate } from "@/lib/media/tmdb";

describe("tmdb helpers", () => {
  it("builds poster URL from path", () => {
    expect(tmdbPosterUrl("/abc.jpg")).toBe("https://image.tmdb.org/t/p/w500/abc.jpg");
    expect(tmdbPosterUrl(null)).toBeNull();
  });

  it("extracts release year", () => {
    expect(yearFromDate("2019-07-14")).toBe(2019);
    expect(yearFromDate(undefined)).toBeNull();
    expect(yearFromDate("invalid")).toBeNull();
  });
});
