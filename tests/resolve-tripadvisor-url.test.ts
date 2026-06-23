import { describe, expect, it } from "vitest";
import { extractTripAdvisorListingUrl } from "@/lib/venues/resolve-tripadvisor-url";

describe("extractTripAdvisorListingUrl", () => {
  it("extracts Restaurant_Review URL with place id", () => {
    const html = `
      <a href="https://www.tripadvisor.es/Restaurant_Review-g187497-d23613502-Reviews-Sips-Barcelona.html">
        Sips
      </a>
    `;
    const url = extractTripAdvisorListingUrl(html);
    expect(url).toContain("Restaurant_Review");
    expect(url).toContain("d23613502");
  });

  it("returns null when no listing found", () => {
    expect(extractTripAdvisorListingUrl("<html>no results</html>")).toBeNull();
  });
});
