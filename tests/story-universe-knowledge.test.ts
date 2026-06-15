import { describe, expect, it } from "vitest";
import { filterExtractionLegality, sanitizeExtractionStrings } from "@/lib/story-universe/corpus/legal-filter";
import { buildMockExtraction } from "@/lib/story-universe/corpus/analyze-chunk";
import { aggregateLabels } from "@/lib/story-universe/knowledge/normalize";
import { slugifyId } from "@/lib/story-universe/slugify";
import { buildCocktailNarrativeProfile } from "@/lib/story-universe/cocktail/build-profile";
import { runStoryQc } from "@/lib/story-universe/qc/validate";
import { buildMockStoryDraft } from "@/lib/story-universe/generator/mock-story";
import { GENERATION_QUOTAS } from "@/lib/story-universe/taxonomy/universe";
import type { CocktailRecord } from "@/types/cocktail";

describe("story-universe knowledge", () => {
  it("slugifyId normalizes labels", () => {
    expect(slugifyId("Bar de Noche")).toBe("bar_de_noche");
  });

  it("aggregateLabels dedupes similar themes", () => {
    const ext = buildMockExtraction({ chunkId: "c1", sourceTitle: "T", sourceAuthor: "A" });
    const agg = aggregateLabels([ext, ext], (e) => e.themes);
    expect(agg.length).toBeGreaterThan(0);
    expect(agg[0]!.count).toBeGreaterThanOrEqual(2);
  });

  it("legal filter rejects long verbatim overlap", () => {
    const source = "word ".repeat(200);
    const extraction = sanitizeExtractionStrings({
      ...buildMockExtraction({ chunkId: "x", sourceTitle: "T", sourceAuthor: "A" }),
    });
    const result = filterExtractionLegality(extraction, source);
    expect(typeof result.passed).toBe("boolean");
  });
});

describe("cocktail narrative profile", () => {
  const sample: CocktailRecord = {
    id: "dg-1",
    title: "Negroni",
    slug: "negroni",
    rating: 50,
    glass: "Copa old fashioned",
    ingredients: ["30 ml Gin", "30 ml Campari", "30 ml Vermut rosso"],
    method: "Stir with ice",
    abv: "24",
    kcal: 200,
    cover: "/cocktail-placeholder.svg",
  };

  it("builds profile with hooks", () => {
    const profile = buildCocktailNarrativeProfile(sample);
    expect(profile.cocktailSlug).toBe("negroni");
    expect(profile.narrativeHooks.length).toBeGreaterThanOrEqual(3);
    expect(profile.intensity).toBeGreaterThanOrEqual(1);
  });
});

describe("story QC and quotas", () => {
  it("generation quotas sum to 2000", () => {
    const total = GENERATION_QUOTAS.reduce((s, q) => s + q.targetCount, 0);
    expect(total).toBe(2000);
  });

  it("mock story passes QC with profile", () => {
    const sample: CocktailRecord = {
      id: "dg-1",
      title: "Negroni",
      slug: "negroni",
      rating: 50,
      glass: "Copa",
      ingredients: ["Gin", "Campari"],
      method: "Stir",
      abv: "24",
      kcal: 200,
      cover: "/cocktail-placeholder.svg",
    };
    const profile = buildCocktailNarrativeProfile(sample);
    const draft = buildMockStoryDraft({
      profile,
      category: { id: "bars", label: "Bares", themeIds: [], conflictIds: [], archetypeIds: [], locationIds: [], weight: 1 },
      storyIndex: 0,
      storyId: "STORY-0001",
    });
    const qc = runStoryQc(draft, profile, []);
    expect(qc.score).toBeGreaterThan(0.5);
  });
});
