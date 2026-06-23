import { describe, expect, it } from "vitest";
import {
  editorialToTripAdvisorAmenities,
  editorialToTripAdvisorLabels,
  mapEditorialHeuristics,
} from "@/lib/venues/enrich-editorial-heuristics";

describe("mapEditorialHeuristics", () => {
  it("detects Japanese cuisine and intimate ambiance", () => {
    const result = mapEditorialHeuristics({
      name: "Narisawa",
      verdict: "Modern Japanese cooking in an intimate Tokyo dining room",
      history:
        "Chef Yoshihiro Narisawa channels satoyama cuisine with seasonal omakase menus.",
    });
    expect(result.cuisineTypes).toContain("japonesa");
    expect(result.idealFor).toContain("romantico");
    expect(result.venueFeatures).toContain("ambiente_intimo");
  });

  it("detects Michelin and worlds50best awards", () => {
    const result = mapEditorialHeuristics({
      verdict: "A Michelin-starred restaurant on the World's 50 Best list",
    });
    expect(result.awards).toContain("michelin");
    expect(result.awards).toContain("worlds50best");
  });

  it("extracts star dishes from signature phrasing", () => {
    const result = mapEditorialHeuristics({
      history: "The signature dish is sweet-and-sour pork with seasonal fruit sauce.",
    });
    expect(result.starDishes.length).toBeGreaterThan(0);
    expect(result.starDishes[0].toLowerCase()).toContain("sweet-and-sour");
  });

  it("returns empty arrays for blank input", () => {
    const result = mapEditorialHeuristics({});
    expect(result.cuisineTypes).toEqual([]);
    expect(result.idealFor).toEqual([]);
  });

  it("maps to TripAdvisor label format", () => {
    const labels = editorialToTripAdvisorLabels({
      cuisineTypes: ["japonesa", "peruana"],
      idealFor: ["romantico", "familias"],
      venueFeatures: ["terraza_exterior", "vistas"],
      starDishes: [],
      awards: ["michelin"],
    });
    expect(labels.cuisineLabels).toContain("japanese");
    expect(labels.features).toContain("romantic");
    expect(labels.features).toContain("outdoor_seating");
    expect(labels.awards).toContain("michelin");
  });
});

describe("real W50 fragments", () => {
  it("enriches La Factoria bar copy", () => {
    const result = mapEditorialHeuristics({
      name: "La Factoría",
      verdict: "Cuban-inspired cocktails with festive dancing and intimate spaces",
      history: "Visitors embark a journey through six spaces with wine-focused Vino.",
    });
    expect(result.idealFor).toContain("celebraciones");
    expect(result.venueFeatures).toContain("ambiente_intimo");
  });
});

describe("editorialToTripAdvisorAmenities", () => {
  it("adds card payment and accessibility amenities from editorial text", () => {
    const editorial = mapEditorialHeuristics({
      verdict: "Family-friendly restaurant with vegan options",
      history: "Wheelchair accessible dining room.",
    });
    const amenities = editorialToTripAdvisorAmenities(
      editorial,
      "Family-friendly restaurant with vegan options. Wheelchair accessible dining room.",
    );
    expect(amenities).toContain("good_for_children");
    expect(amenities).toContain("vegan_options");
    expect(amenities).toContain("wheelchair_accessible");
    expect(amenities).toContain("accepts_credit_cards");
  });
});
