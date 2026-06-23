import type { AlcoholRecord } from "@/types/alcohol";
import type { ImportedSpirit } from "@/lib/products/spirits-import";
import { spiritIdentityKey } from "@/lib/alcohol/spirit-id";

export function extractAbvFromTitle(title: string): number | null {
  const match = title.match(/(\d{1,2}(?:[.,]\d)?)\s*[%º°]/);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

export function isPlaceholderAbv(abv: AlcoholRecord["technical"]["abv"]): boolean {
  if (abv === "—" || abv === "" || abv == null) return true;
  if (typeof abv === "string" && !/\d/.test(abv)) return true;
  return false;
}

export function baseSlugForPackaging(slug: string): string | null {
  if (slug.endsWith("-estuche")) return slug.slice(0, -"-estuche".length);
  return null;
}

function pickCanonicalSlug(slugs: string[]): string {
  const withoutEstuche = slugs.filter((s) => !s.endsWith("-estuche"));
  const candidates = withoutEstuche.length > 0 ? withoutEstuche : slugs;
  return [...candidates].sort((a, b) => a.length - b.length)[0];
}

function mergeRecordFields(target: AlcoholRecord, source: AlcoholRecord): void {
  if (!target.imageUrl && source.imageUrl) target.imageUrl = source.imageUrl;
  if (isPlaceholderAbv(target.technical.abv) && !isPlaceholderAbv(source.technical.abv)) {
    target.technical.abv = source.technical.abv;
  }
  if (target.sensory.nose === "—" && source.sensory.nose !== "—") {
    target.sensory.nose = source.sensory.nose;
  }
  if (target.didactic.history_context === "—" && source.didactic.history_context !== "—") {
    target.didactic.history_context = source.didactic.history_context;
  }
  if (
    target.market.bottle_formats.length === 0 &&
    source.market.bottle_formats.length > 0
  ) {
    target.market.bottle_formats = source.market.bottle_formats;
  }
  target.updatedAt = new Date().toISOString();
}

export function mergePackagingAndIdentityDuplicates(records: AlcoholRecord[]): {
  merged: AlcoholRecord[];
  removedSlugs: string[];
} {
  const bySlug = new Map(records.map((r) => [r.slug, { ...r }]));
  const remove = new Set<string>();

  for (const record of records) {
    const base = baseSlugForPackaging(record.slug);
    if (!base || !bySlug.has(base)) continue;
    const canonical = bySlug.get(base)!;
    mergeRecordFields(canonical, record);
    remove.add(record.slug);
  }

  const identityGroups = new Map<string, string[]>();
  for (const record of records) {
    if (remove.has(record.slug)) continue;
    const key = spiritIdentityKey({
      brand: record.identity.brand,
      name: record.identity.name_exact.replace(/\s*\(estuche\)/i, "").trim(),
      abv: record.technical.abv,
    });
    const list = identityGroups.get(key) ?? [];
    list.push(record.slug);
    identityGroups.set(key, list);
  }

  for (const slugs of identityGroups.values()) {
    if (slugs.length < 2) continue;
    const canonicalSlug = pickCanonicalSlug(slugs);
    const canonical = bySlug.get(canonicalSlug);
    if (!canonical) continue;
    for (const slug of slugs) {
      if (slug === canonicalSlug) continue;
      const other = bySlug.get(slug);
      if (!other) continue;
      mergeRecordFields(canonical, other);
      remove.add(slug);
    }
  }

  const merged = [...bySlug.values()].filter((r) => !remove.has(r.slug));
  return { merged, removedSlugs: [...remove] };
}

export function normalizeAlcoholIds(records: AlcoholRecord[]): {
  records: AlcoholRecord[];
  productCodesFilled: number;
  idsSynced: number;
} {
  let productCodesFilled = 0;
  let idsSynced = 0;

  const normalized = records.map((record) => {
    const next = { ...record };
    if (!next.productCode && next.id) {
      next.productCode = next.id;
      productCodesFilled += 1;
    }
    if (next.productCode && next.id !== next.productCode) {
      next.id = next.productCode;
      idsSynced += 1;
    }
    return next;
  });

  return { records: normalized, productCodesFilled, idsSynced };
}

export function fillAbvFromTitles(records: AlcoholRecord[]): number {
  let filled = 0;
  for (const record of records) {
    if (!isPlaceholderAbv(record.technical.abv)) continue;
    const fromTitle = extractAbvFromTitle(record.identity.name_exact);
    if (fromTitle == null) continue;
    record.technical.abv = fromTitle;
    filled += 1;
  }
  return filled;
}

export function fillImagesFromImport(
  records: AlcoholRecord[],
  imports: ImportedSpirit[],
): number {
  const imageBySource = new Map<string, string>();
  const imageBySlug = new Map<string, string>();
  for (const item of imports) {
    if (item.imageUrl && item.sourceUrl) imageBySource.set(item.sourceUrl.split("#")[0], item.imageUrl);
    if (item.imageUrl) imageBySlug.set(item.slug, item.imageUrl);
  }

  let filled = 0;
  for (const record of records) {
    if (record.imageUrl) continue;
    const fromSource = record.sourceUrl
      ? imageBySource.get(record.sourceUrl.split("#")[0])
      : undefined;
    const fromSlug = record.linkedProductSlug
      ? imageBySlug.get(record.linkedProductSlug)
      : imageBySlug.get(record.slug);
    const image = fromSource ?? fromSlug;
    if (!image) continue;
    record.imageUrl = image;
    record.updatedAt = new Date().toISOString();
    filled += 1;
  }
  return filled;
}

export type NormalizeEncyclopediaResult = {
  records: AlcoholRecord[];
  productCodesFilled: number;
  idsSynced: number;
  removedSlugs: string[];
  abvFilled: number;
  imagesFilled: number;
};

export function normalizeEncyclopediaRecords(
  records: AlcoholRecord[],
  imports: ImportedSpirit[] = [],
): NormalizeEncyclopediaResult {
  const { records: withIds, productCodesFilled, idsSynced } = normalizeAlcoholIds(records);
  const { merged, removedSlugs } = mergePackagingAndIdentityDuplicates(withIds);
  const abvFilled = fillAbvFromTitles(merged);
  const imagesFilled = fillImagesFromImport(merged, imports);
  return {
    records: merged,
    productCodesFilled,
    idsSynced,
    removedSlugs,
    abvFilled,
    imagesFilled,
  };
}
