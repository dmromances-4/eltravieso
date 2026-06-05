import { describe, expect, it } from "vitest";
import { resolveReservationConfig } from "@/lib/venues/reservation";

describe("resolveReservationConfig", () => {
  it("uses iframe for CoverManager embed URL", () => {
    const config = resolveReservationConfig({
      coverManagerUrl: "https://www.covermanager.com/reservation/module/restaurant/embed",
    });
    expect(config.mode).toBe("iframe");
    expect(config.provider).toBe("COVER_MANAGER");
    expect(config.embedUrl).toContain("covermanager");
  });

  it("uses CTA for TheFork URL", () => {
    const config = resolveReservationConfig({
      theForkUrl: "https://www.thefork.com/restaurant/barcelona/r123",
    });
    expect(config.mode).toBe("cta");
    expect(config.provider).toBe("THE_FORK");
  });

  it("prefers unified reservation fields", () => {
    const config = resolveReservationConfig({
      reservationProvider: "OPEN_TABLE",
      reservationUrl: "https://www.opentable.com/r/123",
      coverManagerUrl: "https://www.covermanager.com/old",
    });
    expect(config.provider).toBe("OPEN_TABLE");
    expect(config.url).toBe("https://www.opentable.com/r/123");
    expect(config.mode).toBe("cta");
  });

  it("returns empty when no URLs", () => {
    const config = resolveReservationConfig({});
    expect(config.url).toBeNull();
    expect(config.mode).toBe("cta");
  });
});
