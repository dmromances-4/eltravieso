import { describe, expect, it } from "vitest";
import { mergeSpiritRecords } from "@/lib/alcohol/spirit-id";
import type { AlcoholRecord } from "@/types/alcohol";
import type { ImportedSpirit } from "@/lib/products/spirits-import";

const existing: AlcoholRecord[] = [
  {
    id: "SP-0001",
    productCode: "SP-0001",
    slug: "hendricks-gin",
    family_id: "Spirit>Ginebra",
    category: "Espirituosos",
    subcategory: "Ginebra",
    producer_group: "Hendrick's",
    denomination_of_origin: "Scotland",
    producer_type: "Destilería",
    identity: {
      name_exact: "Hendrick's Gin",
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
    sourceUrl: "https://retailer.example/hendricks",
  },
];

const incoming: ImportedSpirit[] = [
  {
    slug: "hendricks-gin",
    title: "Hendrick's Gin 41.4º",
    category: "gin",
    sourceUrl: "https://retailer.example/hendricks",
    imageUrl: "https://cdn.example/hendricks.jpg",
    metadata: { brand: "Hendrick's", retailer: "vilaviniteca" },
  },
  {
    slug: "tanqueray-london-dry",
    title: "Tanqueray London Dry 43.1º",
    category: "gin",
    sourceUrl: "https://retailer.example/tanqueray",
    metadata: { brand: "Tanqueray", retailer: "vilaviniteca" },
  },
];

describe("merge-alcohol-encyclopedia", () => {
  it("deduplicates by sourceUrl and adds new spirits with SP codes", () => {
    const { merged, added, updated, skippedDuplicates } = mergeSpiritRecords(existing, incoming);

    expect(merged).toHaveLength(2);
    expect(added).toBe(1);
    expect(updated).toBe(1);
    expect(skippedDuplicates).toBe(0);
    expect(merged[0].imageUrl).toBe("https://cdn.example/hendricks.jpg");
    expect(merged[1].productCode).toMatch(/^SP-\d{4}$/);
    expect(merged[1].slug).toBe("tanqueray-london-dry");
  });
});
