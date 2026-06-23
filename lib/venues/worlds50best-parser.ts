import type { Worlds50BestCategory } from "@prisma/client";
import { slugFromDetailPath } from "@/lib/venues/unique-slug";
import { enrichGuideFromScrape } from "@/lib/venues/venue-profile-sync";
import type { NormalizedVenueGuide } from "@/lib/venues/types";

export type W50ListItem = {
  rank: number;
  name: string;
  city: string;
  detailPath: string;
  imageUrl: string | null;
};

const SOCIAL_HOSTS = ["instagram.com", "facebook.com", "twitter.com", "x.com", "youtube.com"];

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function metaContent(html: string, property: string): string | null {
  const key = escapeRegExp(property);
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content="([^"]+)"`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match?.[1]) return match[1];
  }
  return null;
}

function absolutizeUrl(path: string, base: string): string {
  if (path.startsWith("http")) return path;
  if (path.startsWith("//")) return `https:${path}`;
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}

function isValidExternalUrl(href: string): boolean {
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    return !SOCIAL_HOSTS.some((s) => host.includes(s)) && !host.includes("theworlds50best.com");
  } catch {
    return false;
  }
}

export type ParseListOptions = { maxRank?: number };

export function parseListYear(html: string): number | null {
  const sources = [
    metaContent(html, "og:title"),
    html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? null,
  ];

  for (const source of sources) {
    if (!source) continue;
    const match = source.match(/\b(20\d{2})\b/);
    if (match) return Number(match[1]);
  }

  return null;
}

export function parseListPage(
  html: string,
  baseUrl: string,
  options?: ParseListOptions,
): W50ListItem[] {
  const items: W50ListItem[] = [];
  const seenRanks = new Set<number>();
  const chunks = html.split(/<div class="list-item"\s*>/i).slice(1);

  for (const chunk of chunks) {
    const rankMatch = chunk.match(/<p class="rank[^"]*"\s*>(\d+)<\/p>/i);
    const hrefMatch = chunk.match(/href="([^"]+)"/);
    const nameMatch = chunk.match(/<h2>([^<]+)<\/h2>/i);
    const cityMatch = chunk.match(/<\/h2><\/a><p>([^<]+)<\/p>/i);
    const imgMatch = chunk.match(/data-src="([^"]+)"/i);

    if (!rankMatch || !hrefMatch || !nameMatch) continue;

    const rank = Number(rankMatch[1]);
    if (options?.maxRank != null && rank > options.maxRank) continue;
    if (seenRanks.has(rank)) continue;
    seenRanks.add(rank);

    const detailPath = hrefMatch[1];
    let imageUrl: string | null = null;
    if (imgMatch) {
      imageUrl = absolutizeUrl(imgMatch[1], baseUrl);
    }

    items.push({
      rank,
      name: stripHtml(nameMatch[1]),
      city: cityMatch ? stripHtml(cityMatch[1]) : "",
      detailPath,
      imageUrl,
    });
  }

  return items.sort((a, b) => a.rank - b.rank);
}

function extractProfileBlock(html: string): string {
  const startMatch = html.match(/<div[^>]*class="[^"]*\bcontent profile\b[^"]*"/i);
  if (!startMatch || startMatch.index == null) {
    const articleMatch = html.match(/<div[^>]*data-clarity-region="article"[^>]*>/i);
    if (!articleMatch || articleMatch.index == null) return "";
    const start = articleMatch.index;
    const endMarkers = [
      '<h3 class="contact-list-title"',
      'class="contact-list-title"',
      '<div role="complementary"',
    ];
    let end = html.length;
    for (const marker of endMarkers) {
      const idx = html.indexOf(marker, start);
      if (idx > start && idx < end) end = idx;
    }
    return html.slice(start, end);
  }

  const start = startMatch.index;
  const endMarkers = [
    '<h3 class="contact-list-title"',
    'class="contact-list-title"',
    '<div role="complementary"',
  ];

  let end = html.length;
  for (const marker of endMarkers) {
    const idx = html.indexOf(marker, start);
    if (idx > start && idx < end) end = idx;
  }

  return html.slice(start, end);
}

function extractAddress(html: string): string | null {
  const inProfile = html.match(/<p class="location[^"]*"[^>]*>([^<]+)</i);
  if (inProfile) return stripHtml(inProfile[1]);

  const inDiv = html.match(/<div class="location[^"]*"[^>]*>([^<]+)</i);
  if (inDiv) return stripHtml(inDiv[1]);

  return null;
}

function extractParagraphs(block: string): string[] {
  const paras: string[] = [];
  const re = /<p(?![^>]*class="location)[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    const text = stripHtml(m[1]);
    if (text.length > 30) paras.push(text);
  }
  return paras;
}

function extractIntroQuote(block: string): string | null {
  const match = block.match(/<h3 class="intro-quote[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
  return match ? stripHtml(match[1]) : null;
}

function extractExternalWebsite(html: string, profileBlock: string): string | null {
  const blocks = [profileBlock, html];

  for (const block of blocks) {
    const websiteClass = block.match(
      /<a[^>]+class="[^"]*website[^"]*"[^>]+href="(https?:\/\/[^"]+)"/i,
    );
    if (websiteClass && isValidExternalUrl(websiteClass[1])) return websiteClass[1];

    const hrefFirst = block.match(
      /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*class="[^"]*website/i,
    );
    if (hrefFirst && isValidExternalUrl(hrefFirst[1])) return hrefFirst[1];

    const links = [...block.matchAll(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>/gi)];
    for (const [, href] of links) {
      if (isValidExternalUrl(href)) return href;
    }
  }

  return null;
}

function extractChefName(html: string, block: string): string | null {
  const chefTag = html.match(/class="chef[^"]*"[^>]*>([^<]+)</i);
  if (chefTag) {
    return stripHtml(chefTag[1])
      .replace(/^chef\s+/i, "")
      .trim()
      .slice(0, 120);
  }

  const chefInBlock = block.match(/(?:chef|executive chef)\s+([A-Za-zÀ-ÿ' .-]+)/i);
  if (chefInBlock) return chefInBlock[1].trim().slice(0, 120);

  return null;
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  const match = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!match?.[1]) return null;
  try {
    const parsed = JSON.parse(match[1].trim()) as Record<string, unknown>;
    return parsed;
  } catch {
    return null;
  }
}

function parseCountryFromAddress(address: string): string | null {
  const parts = address.split(",").map((p) => p.trim());
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

function extractSocialLinks(html: string): { instagramUrl: string | null; tiktokUrl: string | null } {
  const instagramMatch = html.match(
    /href="(https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._]+)\/?"/i,
  );
  const tiktokMatch = html.match(
    /href="(https?:\/\/(?:www\.)?tiktok\.com\/@[a-zA-Z0-9._]+)\/?"/i,
  );
  return {
    instagramUrl: instagramMatch?.[1] ?? null,
    tiktokUrl: tiktokMatch?.[1] ?? null,
  };
}

export function parseDetailPage(
  html: string,
  listItem: W50ListItem,
  category: Worlds50BestCategory,
  baseUrl: string,
): NormalizedVenueGuide {
  const name = stripHtml(html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1] ?? listItem.name);
  const address = extractAddress(html);
  const profileBlock = extractProfileBlock(html);
  const paragraphs = extractParagraphs(profileBlock);
  const introQuote = extractIntroQuote(profileBlock);
  const jsonLd = extractJsonLd(html);
  const jsonDescription =
    typeof jsonLd?.description === "string" ? stripHtml(jsonLd.description) : null;
  const verdict =
    introQuote ??
    paragraphs.find((p) => p.length > 80) ??
    paragraphs[0] ??
    jsonDescription ??
    null;
  const historyBody = paragraphs.join("\n\n");
  const history =
    introQuote && historyBody
      ? historyBody
      : historyBody || jsonDescription || null;

  const ogImage = metaContent(html, "og:image");
  const photoUrl = listItem.imageUrl ?? (ogImage ? absolutizeUrl(ogImage, baseUrl) : null);

  const sourceUrl = absolutizeUrl(listItem.detailPath, baseUrl);
  const slug = slugFromDetailPath(listItem.detailPath, category);

  const jsonWebsite = typeof jsonLd?.url === "string" ? jsonLd.url : null;
  const externalWebsite =
    extractExternalWebsite(html, profileBlock) ??
    (jsonWebsite && isValidExternalUrl(jsonWebsite) ? jsonWebsite : null);

  const social = extractSocialLinks(html);

  return enrichGuideFromScrape({
    slug,
    name,
    city: listItem.city,
    country: address ? parseCountryFromAddress(address) : null,
    address,
    venueType: category === "BARS" ? "cocteleria" : "restaurante",
    photoUrl,
    history,
    verdict,
    chefName: category === "RESTAURANTS" ? extractChefName(html, profileBlock) : null,
    worlds50bestRank: listItem.rank,
    worlds50bestCategory: category,
    sourceUrl,
    externalWebsite,
    instagramUrl: social.instagramUrl,
    tiktokUrl: social.tiktokUrl,
    enrichmentSource: "worlds50best",
  });
}

function nextUniqueSlug(baseSlug: string, used: Set<string>): string {
  if (!used.has(baseSlug)) {
    used.add(baseSlug);
    return baseSlug;
  }

  let n = 2;
  while (used.has(`${baseSlug}-${n}`)) {
    n += 1;
  }
  const candidate = `${baseSlug}-${n}`;
  used.add(candidate);
  return candidate;
}

export function dedupeSlugs(venues: NormalizedVenueGuide[]): NormalizedVenueGuide[] {
  const used = new Set<string>();
  return venues.map((venue) => {
    const slug = nextUniqueSlug(venue.slug, used);
    if (slug === venue.slug) return venue;
    return { ...venue, slug };
  });
}
