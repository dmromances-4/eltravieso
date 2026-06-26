import { describe, expect, it } from "vitest";
import {
  allocateSpiritCode,
  formatSpiritCode,
  mergeSpiritRecords,
  parseSpiritCodeSequence,
  spiritIdentityKey,
} from "@/lib/alcohol/spirit-id";
import type { AlcoholRecord } from "@/types/alcohol";
import type { ImportedSpirit } from "@/lib/products/spirits-import";

const baseRecord: AlcoholRecord = {
  id: "SP-0001",
  productCode: "SP-0001",
  slug: "hendricks",
  family_id: "Spirit>Gin",
  category: "Espirituosos",
  subcategory: "Ginebra",
  producer_group: "Hendrick's",
  denomination_of_origin: "Scotland",
  producer_type: "Destilería",
  identity: {
    name_exact: "Hendrick's",
    brand: "Hendrick's",
    producer: "Hendrick's",
    country: "Escocia",
    region: "—",
    sub_region: "—",
  },
  technical: {
    raw_material: "—",
    fermentation_type: "—",
    distillation_method: "—",
    abv: 41.4,
  },
  chronology: { vintage: "NV", maturation_time: "—", barrel_type: "—" },
  sensory: { sight: "—", nose: "—", palate: "—" },
  market: { production_status: "—", rarity: "—", bottle_formats: ["700 ml"] },
  didactic: { history_context: "—", mixology_role: "Base", iconic_cocktails: [] },
  advanced: {
    raw_material: "—",
    vessel_type: "—",
    master_creator: "—",
    history_context_short: "—",
  },
  sourceUrl: "https://example.com/hendricks",
};

describe("spirit-id", () => {
  it("allocates next SP code", () => {
    expect(parseSpiritCodeSequence("SP-0042")).toBe(42);
    expect(allocateSpiritCode([baseRecord])).toBe(formatSpiritCode(2));
  });

  it("dedupes by sourceUrl on merge", () => {
    const incoming: ImportedSpirit[] = [
      {
        title: "Hendrick's (41,4º)",
        slug: "hendricks",
        description: "Gin",
        category: "ALCOHOL",
        priceCents: 2000,
        imageUrl: "https://cdn.example/gin.jpg",
        sourceUrl: "https://example.com/hendricks",
        format: "UNIT",
        volumeMl: 700,
        metadata: { retailer: "vilaviniteca", brand: "Hendrick's" },
      },
    ];
    const { merged, added, skippedDuplicates } = mergeSpiritRecords([baseRecord], incoming);
    expect(added).toBe(0);
    expect(skippedDuplicates).toBe(0);
    expect(merged).toHaveLength(1);
    expect(merged[0].imageUrl).toBe("https://cdn.example/gin.jpg");
  });

  it("adds new spirit with unique identity", () => {
    const incoming: ImportedSpirit[] = [
      {
        title: "Nueva Gin 40º",
        slug: "nueva-gin",
        description: "Nueva",
        category: "ALCOHOL",
        priceCents: 1500,
        sourceUrl: "https://example.com/nueva-gin",
        format: "UNIT",
        volumeMl: 700,
        metadata: { retailer: "vilaviniteca", brand: "Nueva" },
      },
    ];
    const { merged, added } = mergeSpiritRecords([baseRecord], incoming);
    expect(added).toBe(1);
    expect(merged).toHaveLength(2);
    expect(spiritIdentityKey({
      brand: "Nueva",
      name: "Nueva Gin 40º",
      abv: 40,
      volumeMl: 700,
    })).toContain("nueva");
  });

  it("skips -estuche import when base slug already exists", () => {
    const existing: AlcoholRecord[] = [
      {
        ...baseRecord,
        slug: "don-julio-anejo",
        id: "SP-0100",
        productCode: "SP-0100",
        sourceUrl: "https://example.com/don-julio-anejo",
      },
    ];
    const incoming: ImportedSpirit[] = [
      {
        title: "Don Julio Añejo (Estuche)",
        slug: "don-julio-anejo-estuche",
        description: "Tequila",
        category: "ALCOHOL",
        priceCents: 5000,
        sourceUrl: "https://example.com/don-julio-anejo-estuche",
        format: "UNIT",
        volumeMl: 700,
        metadata: { retailer: "vilaviniteca", brand: "Don Julio" },
      },
    ];
    const { merged, added, skippedDuplicates } = mergeSpiritRecords(existing, incoming);
    expect(merged).toHaveLength(1);
    expect(added).toBe(0);
    expect(skippedDuplicates).toBe(1);
  });
});
