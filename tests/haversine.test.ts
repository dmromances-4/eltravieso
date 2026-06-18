import { describe, expect, it } from "vitest";
import { haversineKm } from "@/lib/map/haversine";

describe("haversineKm", () => {
  it("returns 0 for same point", () => {
    expect(haversineKm(40.4, -3.7, 40.4, -3.7)).toBe(0);
  });

  it("computes approximate Madrid–Barcelona distance", () => {
    const km = haversineKm(40.4168, -3.7038, 41.3874, 2.1686);
    expect(km).toBeGreaterThan(500);
    expect(km).toBeLessThan(550);
  });
});
