import { describe, expect, it } from "vitest";
import {
  extractAbvFromTitle,
  mergePackagingAndIdentityDuplicates,
  normalizeAlcoholIds,
} from "@/lib/alcohol/normalize-encyclopedia";
import { formatAbv } from "@/lib/alcohol/format-abv";
import type { AlcoholRecord } from "@/types/alcohol";

function minimalRecord(overrides: Partial<AlcoholRecord> & { slug: string }): AlcoholRecord {
  return {
    id: overrides.id ?? "SP-9999",
    slug: overrides.slug,
    family_id: "Spirit>Gin",
    category: "Espirituosos",
    subcategory: "Ginebra",
    producer_group: "Test",
    denomination_of_origin: "—",
    producer_type: "—",
    identity: {
      name_exact: overrides.identity?.name_exact ?? "Test Gin",
      brand: overrides.identity?.brand ?? "Test",
      producer: "Test",
      country: "—",
      region: "—",
      sub_region: "—",
      ...overrides.identity,
    },
    technical: {
      raw_material: "—",
      fermentation_type: "—",
      distillation_method: "—",
      abv: overrides.technical?.abv ?? "—",
      ...overrides.technical,
    },
    chronology: { vintage: "NV", maturation_time: "—", barrel_type: "—" },
    sensory: { sight: "—", nose: "—", palate: "—" },
    market: { production_status: "—", rarity: "—", bottle_formats: [] },
    didactic: { history_context: "—", mixology_role: "Base", iconic_cocktails: [] },
    advanced: {
      raw_material: "—",
      vessel_type: "—",
      master_creator: "—",
      history_context_short: "—",
    },
    ...overrides,
  };
}

describe("normalize-alcohol-encyclopedia", () => {
  it("fills productCode from legacy id", () => {
    const { records, productCodesFilled } = normalizeAlcoholIds([
      minimalRecord({ slug: "macallan", id: "SP-001", productCode: undefined }),
    ]);
    expect(productCodesFilled).toBe(1);
    expect(records[0].productCode).toBe("SP-001");
  });

  it("merges -estuche variant into base slug", () => {
    const base = minimalRecord({
      slug: "clase-azul-mezcal-san-luis",
      identity: { name_exact: "Clase Azul Mezcal San Luis", brand: "Clase Azul", producer: "Clase Azul", country: "MX", region: "—", sub_region: "—" },
      technical: { raw_material: "—", fermentation_type: "—", distillation_method: "—", abv: 40 },
    });
    const variant = minimalRecord({
      slug: "clase-azul-mezcal-san-luis-estuche",
      identity: { name_exact: "Clase Azul Mezcal San Luis (Estuche)", brand: "Clase Azul", producer: "Clase Azul", country: "MX", region: "—", sub_region: "—" },
      technical: { raw_material: "—", fermentation_type: "—", distillation_method: "—", abv: 40 },
      imageUrl: "https://cdn.example/clase.jpg",
    });
    const { merged, removedSlugs } = mergePackagingAndIdentityDuplicates([base, variant]);
    expect(merged).toHaveLength(1);
    expect(removedSlugs).toContain("clase-azul-mezcal-san-luis-estuche");
    expect(merged[0].imageUrl).toBe("https://cdn.example/clase.jpg");
  });

  it("extracts ABV from title", () => {
    expect(extractAbvFromTitle("Gin Brockmans 41.4º")).toBe(41.4);
    expect(extractAbvFromTitle("Vodka 38%")).toBe(38);
  });

  it("formatAbv hides placeholders", () => {
    expect(formatAbv("—")).toBeNull();
    expect(formatAbv(41.4)).toBe("41.4% ABV");
  });
});
