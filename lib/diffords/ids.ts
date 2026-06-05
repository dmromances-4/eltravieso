export function extractDiffordsIdFromUrl(url: string): number | undefined {
  const match = url.match(/\/cocktails\/recipe\/(\d+)\//i);
  if (!match) return undefined;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : undefined;
}

export function cocktailIdFromDiffordsId(diffordsId: number): string {
  return `dg-${diffordsId}`;
}

export function cocktailIdFromSlug(slug: string): string {
  return `slug-${slug}`;
}
