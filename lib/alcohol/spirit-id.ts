import type { AlcoholRecord } from "@/types/alcohol";
import type { ImportedSpirit } from "@/lib/products/spirits-import";

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function parseSpiritCodeSequence(code: string | undefined | null): number {
  if (!code) return 0;
  const match = /^SP-(\d+)$/i.exec(code.trim());
  return match ? Number(match[1]) : 0;
}

export function formatSpiritCode(sequence: number): string {
  return `SP-${String(sequence).padStart(4, "0")}`;
}

export function allocateSpiritCode(records: AlcoholRecord[]): string {
  let max = 0;
  for (const record of records) {
    max = Math.max(max, parseSpiritCodeSequence(record.productCode ?? record.id));
  }
  return formatSpiritCode(max + 1);
}

export function spiritIdentityKey(input: {
  brand?: string;
  name?: string;
  abv?: number | string | null;
  volumeMl?: number | null;
}): string {
  const brand = normalizeText(input.brand ?? "");
  const name = normalizeText(input.name ?? "");
  const abv = String(input.abv ?? "").replace(/[^\d.]/g, "");
  const vol = input.volumeMl != null ? String(input.volumeMl) : "";
  return [brand, name, abv, vol].filter(Boolean).join("|");
}

export function slugFromSpiritTitle(title: string): string {
  return normalizeText(title).replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
}

export type MergeSpiritResult = {
  merged: AlcoholRecord[];
  added: number;
  updated: number;
  skippedDuplicates: number;
};

function subcategoryFromProduct(category: string, metadata?: ImportedSpirit["metadata"]): string {
  const type = metadata?.retailerLabel ?? category;
  if (/gin|ginebra/i.test(type)) return "Ginebra";
  if (/ron/i.test(type)) return "Ron";
  if (/vodka/i.test(type)) return "Vodka";
  if (/whisky|whiskey/i.test(type)) return "Whisky";
  if (/tequila|mezcal/i.test(type)) return "Tequila";
  if (/vermut/i.test(type)) return "Vermut";
  if (/brandy|cognac/i.test(type)) return "Brandy";
  return "Destilados";
}

export function importedSpiritToRecord(
  spirit: ImportedSpirit,
  code: string,
): AlcoholRecord {
  const brand = spirit.metadata?.brand ?? spirit.title.split(" ")[0] ?? spirit.title;
  const abvMatch = spirit.title.match(/(\d{1,2}(?:[.,]\d)?)\s*º?/);
  const abv = abvMatch ? Number(abvMatch[1].replace(",", ".")) : "—";

  return {
    id: code,
    productCode: code,
    slug: spirit.slug,
    family_id: `Spirit>${subcategoryFromProduct(spirit.category, spirit.metadata)}`,
    category: "Espirituosos",
    subcategory: subcategoryFromProduct(spirit.category, spirit.metadata),
    producer_group: brand,
    denomination_of_origin: spirit.metadata?.origin ?? "—",
    producer_type: spirit.metadata?.retailerLabel ?? "Importación retailer",
    identity: {
      name_exact: spirit.title,
      brand,
      producer: brand,
      country: spirit.metadata?.origin ?? "—",
      region: "—",
      sub_region: "—",
    },
    technical: {
      raw_material: "Pendiente de validación",
      fermentation_type: "—",
      distillation_method: "—",
      abv,
    },
    chronology: {
      vintage: "NV",
      maturation_time: "—",
      barrel_type: "—",
    },
    sensory: {
      sight: "—",
      nose: spirit.description?.slice(0, 200) ?? "—",
      palate: "—",
    },
    market: {
      production_status: "En producción",
      rarity: "—",
      bottle_formats: spirit.volumeMl ? [`${spirit.volumeMl} ml`] : [],
    },
    didactic: {
      history_context: spirit.metadata?.history ?? spirit.description ?? "—",
      mixology_role: "Base / modifier",
      iconic_cocktails: [],
    },
    advanced: {
      raw_material: "—",
      vessel_type: "—",
      master_creator: "—",
      history_context_short: spirit.description?.slice(0, 120) ?? "—",
    },
    imageUrl: spirit.imageUrl ?? null,
    sourceUrl: spirit.sourceUrl ?? spirit.metadata?.sourceUrl,
    sourceRetailer: spirit.metadata?.retailer,
    linkedProductSlug: spirit.slug,
    updatedAt: new Date().toISOString(),
  };
}

export function mergeSpiritRecords(
  existing: AlcoholRecord[],
  incoming: ImportedSpirit[],
): MergeSpiritResult {
  const bySourceUrl = new Map<string, AlcoholRecord>();
  const byIdentity = new Map<string, AlcoholRecord>();
  const bySlug = new Map<string, AlcoholRecord>();

  for (const record of existing) {
    if (record.sourceUrl) bySourceUrl.set(record.sourceUrl, record);
    byIdentity.set(spiritIdentityKey({
      brand: record.identity.brand,
      name: record.identity.name_exact,
      abv: record.technical.abv,
    }), record);
    bySlug.set(record.slug, record);
  }

  const merged = [...existing];
  let added = 0;
  let updated = 0;
  let skippedDuplicates = 0;

  for (const spirit of incoming) {
    const sourceUrl = spirit.sourceUrl ?? spirit.metadata?.sourceUrl;
    const identityKey = spiritIdentityKey({
      brand: spirit.metadata?.brand ?? spirit.title,
      name: spirit.title,
      abv: spirit.metadata?.abv,
      volumeMl: spirit.volumeMl,
    });

    const duplicate =
      (sourceUrl && bySourceUrl.get(sourceUrl)) ||
      byIdentity.get(identityKey) ||
      bySlug.get(spirit.slug);

    if (duplicate) {
      if (spirit.imageUrl && !duplicate.imageUrl) {
        duplicate.imageUrl = spirit.imageUrl;
        duplicate.updatedAt = new Date().toISOString();
        updated += 1;
      } else {
        skippedDuplicates += 1;
      }
      continue;
    }

    const code = allocateSpiritCode(merged);
    const record = importedSpiritToRecord(spirit, code);
    merged.push(record);
    if (record.sourceUrl) bySourceUrl.set(record.sourceUrl, record);
    byIdentity.set(identityKey, record);
    bySlug.set(record.slug, record);
    added += 1;
  }

  return { merged, added, updated, skippedDuplicates };
}

export function findDuplicateSpiritGroups(records: AlcoholRecord[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const record of records) {
    const key = record.sourceUrl || spiritIdentityKey({
      brand: record.identity.brand,
      name: record.identity.name_exact,
      abv: record.technical.abv,
    });
    const list = groups.get(key) ?? [];
    list.push(record.slug);
    groups.set(key, list);
  }
  return [...groups.values()].filter((g) => g.length > 1);
}
