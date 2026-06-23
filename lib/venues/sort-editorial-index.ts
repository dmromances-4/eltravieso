import type { Worlds50BestCategory } from "@prisma/client";

export type EditorialIndexSortable = {
  slug: string;
  name: string;
  city: string;
  worlds50bestRank: number;
  worlds50bestCategory: Worlds50BestCategory | string;
  listScope?: string | null;
  regionalRank?: number | null;
  regionTags?: string[];
};

function categoryOrder(category: Worlds50BestCategory | string): number {
  return category === "BARS" ? 0 : 1;
}

function scopeOrder(scope: string | null | undefined): number {
  return scope === "GLOBAL" ? 0 : 1;
}

function primaryRank(venue: EditorialIndexSortable): number {
  if (venue.listScope === "GLOBAL") return venue.worlds50bestRank || 999;
  return venue.regionalRank ?? venue.worlds50bestRank ?? 999;
}

function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** GLOBAL → BARS/RESTAURANTS → rank (global o regional) → nombre. */
export function compareEditorialIndexVenues(
  a: EditorialIndexSortable,
  b: EditorialIndexSortable,
): number {
  const scope = scopeOrder(a.listScope) - scopeOrder(b.listScope);
  if (scope !== 0) return scope;

  const cat = categoryOrder(a.worlds50bestCategory) - categoryOrder(b.worlds50bestCategory);
  if (cat !== 0) return cat;

  const rankA = primaryRank(a);
  const rankB = primaryRank(b);
  if (rankA !== rankB) return rankA - rankB;

  const regionalA = a.regionalRank ?? 999;
  const regionalB = b.regionalRank ?? 999;
  if (regionalA !== regionalB) return regionalA - regionalB;

  return a.name.localeCompare(b.name, "es");
}

export function sortEditorialIndexVenues<T extends EditorialIndexSortable>(venues: T[]): T[] {
  return [...venues].sort(compareEditorialIndexVenues);
}

export function filterEditorialIndexVenues<T extends EditorialIndexSortable>(
  venues: T[],
  query: string,
): T[] {
  const q = normalizeQuery(query);
  if (!q) return venues;

  return venues.filter((venue) => {
    const haystack = [
      venue.name,
      venue.city,
      venue.slug,
      venue.worlds50bestCategory,
      ...(venue.regionTags ?? []),
    ]
      .join(" ")
      .toLowerCase();
    const normalizedHaystack = haystack
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return normalizedHaystack.includes(q);
  });
}

/** Filtra pins del mapa (mismos criterios que el índice editorial). */
export function matchesMapVenueSearch(
  venue: {
    name: string;
    city: string;
    slug: string;
    worlds50bestCategory?: string | null;
    regionTags?: string[];
  },
  query: string,
): boolean {
  const q = normalizeQuery(query);
  if (!q) return true;
  const haystack = [
    venue.name,
    venue.city,
    venue.slug,
    venue.worlds50bestCategory ?? "",
    ...(venue.regionTags ?? []),
  ]
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return haystack.includes(q);
}
