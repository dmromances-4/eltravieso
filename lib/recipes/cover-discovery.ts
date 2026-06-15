import { fetchDiffordsHtml } from "@/lib/diffords/fetch-recipe";
import { diffordsTimeoutMs, fetchWithTimeout, withTimeout } from "@/lib/recipes/fetch-with-timeout";
import { readEnvKey } from "@/lib/recipes/cover-env";
import type { RecipeImageInput } from "@/lib/recipes/image-prompt";

export type CoverCandidateSource = "pexels" | "unsplash" | "diffords_reference";

export type CoverLicenseKind = "free_stock" | "diffords_reference";

export type CoverCandidate = {
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  source: CoverCandidateSource;
  license: CoverLicenseKind;
  attribution?: string;
  alt?: string;
  score?: number;
};

export function extractOgImageFromHtml(html: string): string | null {
  const patterns = [
    /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
    /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i,
    /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
    /<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return null;
}

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9áéíóúüñ\s-]/gi, " ").replace(/\s+/g, " ").trim();
}

function mainSpiritKeyword(ingredients: string[]): string {
  const haystack = ingredients.join(" ").toLowerCase();
  if (/gin|ginebra/.test(haystack)) return "gin";
  if (/whisky|whiskey|bourbon|rye|scotch/.test(haystack)) return "whiskey";
  if (/rum|ron/.test(haystack)) return "rum";
  if (/tequila|mezcal/.test(haystack)) return "tequila";
  if (/vermut|vermouth/.test(haystack)) return "vermouth";
  if (/campari|aperol|bitter/.test(haystack)) return "bitter";
  return "";
}

export function buildCoverSearchQueries(input: RecipeImageInput): string[] {
  const spirit = mainSpiritKeyword(input.ingredients);
  const glass = input.glass?.replace(/copa de |vaso /gi, "").trim();
  const queries = [
    `${input.title} cocktail`,
    `${input.title} cocktail drink photography`,
  ];
  if (glass) queries.push(`${input.title} ${glass} cocktail`);
  if (spirit) queries.push(`${input.title} ${spirit} cocktail`);
  return [...new Set(queries)];
}

async function discoverDiffordsReference(sourceUrl: string): Promise<CoverCandidate | null> {
  try {
    const html = await withTimeout(
      fetchDiffordsHtml(sourceUrl, false, 1),
      diffordsTimeoutMs(),
      "Difford's reference",
    );
    const url = extractOgImageFromHtml(html);
    if (!url) return null;
    return {
      url,
      source: "diffords_reference",
      license: "diffords_reference",
      alt: "Difford's recipe reference",
    };
  } catch (error) {
    console.warn("[cover-discovery] Difford's reference failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  alt?: string;
  photographer?: string;
  src: { large2x?: string; large?: string; medium?: string };
};

async function searchPexels(query: string, perPage = 5): Promise<CoverCandidate[]> {
  const apiKey = readEnvKey("PEXELS_API_KEY");
  if (!apiKey) return [];

  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("orientation", "portrait");

  const res = await fetchWithTimeout(url.toString(), {
    headers: { Authorization: apiKey },
  });
  if (!res.ok) {
    console.warn("[cover-discovery] Pexels error:", res.status);
    return [];
  }

  const data = (await res.json()) as { photos?: PexelsPhoto[] };
  return (data.photos ?? []).map((photo) => ({
    url: photo.src.large2x ?? photo.src.large ?? photo.src.medium ?? "",
    thumbnailUrl: photo.src.medium,
    width: photo.width,
    height: photo.height,
    source: "pexels" as const,
    license: "free_stock" as const,
    attribution: photo.photographer ? `Photo by ${photo.photographer} on Pexels` : "Pexels",
    alt: photo.alt,
  }));
}

type UnsplashPhoto = {
  id: string;
  width: number;
  height: number;
  alt_description?: string | null;
  description?: string | null;
  urls: { regular?: string; full?: string; small?: string };
  user?: { name?: string; links?: { html?: string } };
};

async function searchUnsplash(query: string, perPage = 5): Promise<CoverCandidate[]> {
  const accessKey = readEnvKey("UNSPLASH_ACCESS_KEY");
  if (!accessKey) return [];

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("orientation", "portrait");

  const res = await fetchWithTimeout(url.toString(), {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });
  if (!res.ok) {
    console.warn("[cover-discovery] Unsplash error:", res.status);
    return [];
  }

  const data = (await res.json()) as { results?: UnsplashPhoto[] };
  return (data.results ?? []).map((photo) => ({
    url: photo.urls.regular ?? photo.urls.full ?? photo.urls.small ?? "",
    thumbnailUrl: photo.urls.small,
    width: photo.width,
    height: photo.height,
    source: "unsplash" as const,
    license: "free_stock" as const,
    attribution: photo.user?.name ? `Photo by ${photo.user.name} on Unsplash` : "Unsplash",
    alt: photo.alt_description ?? photo.description ?? undefined,
  }));
}

export type DiscoverCoverOptions = {
  sourceUrl?: string;
  maxPerSource?: number;
  maxQueries?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dedupeCandidates(candidates: CoverCandidate[]): CoverCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });
}

export async function discoverCoverCandidates(
  input: RecipeImageInput,
  options: DiscoverCoverOptions = {},
): Promise<CoverCandidate[]> {
  const candidates: CoverCandidate[] = [];
  const queries = buildCoverSearchQueries(input).slice(0, options.maxQueries ?? 3);
  const perPage = options.maxPerSource ?? 5;

  if (options.sourceUrl) {
    const diffords = await discoverDiffordsReference(options.sourceUrl);
    if (diffords) candidates.push(diffords);
  }

  for (let i = 0; i < queries.length; i += 1) {
    if (i > 0) await sleep(250);
    const query = queries[i];
    const [pexels, unsplash] = await Promise.all([
      searchPexels(query, perPage),
      searchUnsplash(query, perPage),
    ]);
    candidates.push(...pexels, ...unsplash);
  }

  return dedupeCandidates(candidates.filter((c) => Boolean(c.url)));
}

export function titleMatchScore(title: string, candidateText: string): number {
  const normalizedTitle = normalizeTitle(title);
  const normalizedText = normalizeTitle(candidateText);
  if (!normalizedTitle || !normalizedText) return 0;

  const titleTokens = normalizedTitle.split(" ").filter((t) => t.length > 2);
  if (titleTokens.length === 0) return 0;

  let hits = 0;
  for (const token of titleTokens) {
    if (normalizedText.includes(token)) hits += 1;
  }
  return hits / titleTokens.length;
}
