import { describe, expect, it } from "vitest";
import {
  formatVenueCode,
  parseTripadvisorPlaceIdFromUrl,
  parseVenueCodeSequence,
  validateGoogleBusinessId,
  validateTripadvisorPlaceId,
  validateVenueCode,
} from "@/lib/venues/external-ids";

describe("venue external ids", () => {
  it("validates venue code format", () => {
    expect(validateVenueCode("ET-LOC-00042")).toEqual({ ok: true, value: "ET-LOC-00042" });
    expect(validateVenueCode("loc-1").ok).toBe(false);
  });

  it("formats and parses venue code sequence", () => {
    expect(formatVenueCode(42)).toBe("ET-LOC-00042");
    expect(parseVenueCodeSequence("ET-LOC-00042")).toBe(42);
  });

  it("validates Google Business IDs", () => {
    expect(validateGoogleBusinessId("ChIJN1t_tDeuEmsRUsoyG83frY4").ok).toBe(true);
    expect(validateGoogleBusinessId("12345678901234567890").ok).toBe(true);
    expect(validateGoogleBusinessId("not-valid").ok).toBe(false);
    expect(validateGoogleBusinessId("").ok).toBe(true);
  });

  it("validates and parses TripAdvisor place IDs", () => {
    const url =
      "https://www.tripadvisor.es/Restaurant_Review-g294452-d12345678-Reviews-Bar.html";
    expect(parseTripadvisorPlaceIdFromUrl(url)).toBe("d12345678");
    expect(validateTripadvisorPlaceId("d12345678")).toEqual({ ok: true, value: "d12345678" });
    expect(validateTripadvisorPlaceId(url).ok).toBe(true);
    expect(validateTripadvisorPlaceId("bad-id").ok).toBe(false);
  });
});
