import type { Worlds50BestCategory } from "@prisma/client";
import { slugFromDetailPath } from "@/lib/venues/unique-slug";
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

function metaContent(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i",
  );
  return html.match(re)?.[1] ?? html.match(alt)?.[1] ?? null;
}

function absolutizeUrl(path: string, base: string): string {
  if (path.startsWith("http")) return path;
  if (path.startsWith("//")) return `https:${path}`;
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}

export type ParseListOptions = { maxRank?: number };

export function parseListPage(
  html: string,
  baseUrl: string,
  options?: ParseListOptions,
): W50ListItem[] {
  const items: W50ListItem[] = [];
  const seenRanks = new Set<number>();
  const chunks = html.split('<div class="list-item" >').slice(1);

  for (const chunk of chunks) {
    const rankMatch = chunk.match(/<p class="rank[^"]*" >(\d+)<\/p>/);
    const hrefMatch = chunk.match(/href="([^"]+)"/);
    const nameMatch = chunk.match(/<h2>([^<]+)<\/h2>/);
    const cityMatch = chunk.match(/<\/h2><\/a><p>([^<]+)<\/p>/);
    const imgMatch = chunk.match(/data-src="([^"]+)"/);

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
  const m =
    html.match(/<div class="content profile"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i) ??
    html.match(/<div class="content profile"[^>]*>([\s\S]*?)<\/div>/i);
  return m?.[1] ?? "";
}

function extractParagraphs(block: string): string[] {
  const paras: string[] = [];
  const re = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    const text = stripHtml(m[1]);
    if (text.length > 30) paras.push(text);
  }
  return paras;
}

function extractExternalWebsite(block: string): string | null {
  const links = [...block.matchAll(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>/gi)];
  for (const [, href] of links) {
    try {
      const host = new URL(href).hostname.replace(/^www\./, "");
      if (!SOCIAL_HOSTS.some((s) => host.includes(s)) && !host.includes("theworlds50best.com")) {
        return href;
      }
    } catch {
      // ignore invalid URLs
    }
  }
  return null;
}

function extractChefName(html: string, block: string): string | null {
  const chefInBlock = block.match(/chef\s+([A-Za-zÀ-ÿ' .-]+)/i);
  if (chefInBlock) return chefInBlock[1].trim().slice(0, 120);

  const chefTag = html.match(/class="chef[^"]*"[^>]*>([^<]+)</i);
  if (chefTag) return stripHtml(chefTag[1]);

  return null;
}

function parseCountryFromAddress(address: string): string | null {
  const parts = address.split(",").map((p) => p.trim());
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

export function parseDetailPage(
  html: string,
  listItem: W50ListItem,
  category: Worlds50BestCategory,
  baseUrl: string,
): NormalizedVenueGuide {
  const name = stripHtml(html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1] ?? listItem.name);
  const locationMatch = html.match(/class="location[^"]*"[^>]*>([^<]+)</i);
  const address = locationMatch ? stripHtml(locationMatch[1]) : null;

  const profileBlock = extractProfileBlock(html);
  const paragraphs = extractParagraphs(profileBlock);
  const history = paragraphs.length ? paragraphs.join("\n\n") : null;
  const verdict = paragraphs.find((p) => p.length > 80) ?? paragraphs[0] ?? null;

  const ogImage = metaContent(html, "og:image");
  const photoUrl = listItem.imageUrl ?? (ogImage ? absolutizeUrl(ogImage, baseUrl) : null);

  const sourceUrl = absolutizeUrl(listItem.detailPath, baseUrl);
  const slug = slugFromDetailPath(listItem.detailPath, category);

  return {
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
    externalWebsite: extractExternalWebsite(profileBlock),
  };
}

export function dedupeSlugs(venues: NormalizedVenueGuide[]): NormalizedVenueGuide[] {
  const seen = new Map<string, number>();
  return venues.map((v) => {
    const count = seen.get(v.slug) ?? 0;
    seen.set(v.slug, count + 1);
    if (count === 0) return v;
    const suffix = v.worlds50bestCategory === "BARS" ? "-bar" : "-restaurant";
    return { ...v, slug: `${v.slug}${suffix}` };
  });
}
