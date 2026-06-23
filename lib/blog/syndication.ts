import fs from "fs/promises";
import path from "path";

import prisma from "@/lib/prisma";
import {
  ensureUniqueCuratedSlug,
  parseDurationToSecs,
  youtubeEmbedUrl,
  youtubeFeedUrl,
  youtubeVideoIdFromUrl,
  youtubeWatchUrl,
} from "@/lib/blog/curated-slug";
import { buildExcerptHtml, truncateSummary } from "@/lib/blog/excerpt";
import { fetchRssFeedItems, filterItemsSince, type RssFeedItem } from "@/lib/blog/rss-feed";
import { ensureUniqueBlogSlug } from "@/lib/blog/slug";
import { isUrlAllowed } from "@/lib/scrape/robots";
import { fetchWithTimeout } from "@/lib/recipes/fetch-with-timeout";

const RATE_MS = Number(process.env.RATE_MS ?? 2000);
const USER_AGENT = "ElTraviesoBlogBot/1.0 (+https://eltravieso.com/blog)";
let lastFetchAt = 0;

export type SyndicationKind = "written" | "video" | "podcast" | "all";

export type SyndicationOptions = {
  kind: SyndicationKind;
  since: Date;
  writerSlug?: string;
  limit?: number;
  dryRun?: boolean;
  forceFetch?: boolean;
};

export type SyndicationResult = {
  kind: SyndicationKind;
  imported: number;
  skipped: number;
  errors: string[];
};

async function throttle() {
  const elapsed = Date.now() - lastFetchAt;
  if (elapsed < RATE_MS) {
    await new Promise((r) => setTimeout(r, RATE_MS - elapsed));
  }
  lastFetchAt = Date.now();
}

async function readCache(cacheKey: string, forceFetch?: boolean): Promise<string | null> {
  const file = path.resolve(process.cwd(), ".scrape-cache", "blog", `${cacheKey}.html`);
  if (!forceFetch) {
    try {
      const stat = await fs.stat(file);
      if (Date.now() - stat.mtimeMs < 24 * 60 * 60 * 1000) {
        return await fs.readFile(file, "utf8");
      }
    } catch {
      // miss
    }
  }
  return null;
}

async function writeCache(cacheKey: string, html: string) {
  const dir = path.resolve(process.cwd(), ".scrape-cache", "blog");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${cacheKey}.html`), html, "utf8");
}

function cacheKeyFromUrl(url: string): string {
  return Buffer.from(url).toString("base64url").slice(0, 80);
}

export async function fetchPageHtml(url: string, forceFetch?: boolean): Promise<string | null> {
  const allowed = await isUrlAllowed(url, USER_AGENT);
  if (!allowed) return null;

  const key = cacheKeyFromUrl(url);
  const cached = await readCache(key, forceFetch);
  if (cached) return cached;

  await throttle();
  const res = await fetchWithTimeout(url, { headers: { "User-Agent": USER_AGENT } }, 15000);
  if (!res.ok) return null;
  const html = await res.text();
  await writeCache(key, html);
  return html;
}

function metaContent(html: string, property: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const alt = html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, "i"),
  );
  return re.exec(html)?.[1] ?? alt?.[1];
}

function publisherFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "fuente original";
  }
}

async function syncWrittenForAuthor(
  author: {
    id: string;
    slug: string;
    name: string;
    writtenFeedUrls: string[];
  },
  options: SyndicationOptions,
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];
  const limit = options.limit ?? 20;

  for (const feedUrl of author.writtenFeedUrls) {
    try {
      const items = filterItemsSince(await fetchRssFeedItems(feedUrl, 50), options.since);
      for (const item of items.slice(0, limit)) {
        const sourceUrl = item.link?.trim();
        if (!sourceUrl) {
          skipped += 1;
          continue;
        }

        const existing = await prisma.blogPost.findUnique({ where: { sourceUrl } });
        if (existing) {
          skipped += 1;
          continue;
        }

        let bodyHtml = item.contentHtml ?? item.summary ?? "";
        if (!bodyHtml || stripTags(bodyHtml).length < 120) {
          const pageHtml = await fetchPageHtml(sourceUrl, options.forceFetch);
          if (pageHtml) {
            const article =
              pageHtml.match(/<article[\s\S]*?<\/article>/i)?.[0] ??
              pageHtml.match(/<main[\s\S]*?<\/main>/i)?.[0];
            bodyHtml = article ?? pageHtml;
          }
        }

        const { excerptHtml, excerptPlain, wordCount } = buildExcerptHtml(bodyHtml);
        const coverUrl = item.imageUrl ?? (await fetchPageHtml(sourceUrl, options.forceFetch).then((h) => (h ? metaContent(h, "og:image") : null)));
        const content = excerptHtml;

        if (options.dryRun) {
          console.log(`[dry-run] written: ${item.title} (${sourceUrl})`);
          imported += 1;
          continue;
        }

        const slug = await ensureUniqueBlogSlug(prisma, item.title);
        await prisma.blogPost.create({
          data: {
            title: item.title,
            slug,
            content,
            excerpt: truncateSummary(excerptPlain, 200),
            coverUrl: coverUrl ?? null,
            tags: ["syndicated", author.slug],
            published: true,
            publishedAt: item.pubDate ?? new Date(),
            locale: "es",
            editorialAuthorId: author.id,
            sourceUrl,
            sourcePublishedAt: item.pubDate ?? null,
            ingestionType: "syndicated",
            canonicalUrl: sourceUrl,
            metadata: {
              sourcePublisher: publisherFromUrl(sourceUrl),
              excerptWordCount: wordCount,
              lastSyncedAt: new Date().toISOString(),
            },
          },
        });
        imported += 1;
      }
    } catch (error) {
      errors.push(`${author.slug} written feed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { imported, skipped, errors };
}

async function syncVideoForAuthor(
  author: {
    id: string;
    slug: string;
    name: string;
    youtubeChannelId: string | null;
  },
  options: SyndicationOptions,
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  if (!author.youtubeChannelId) return { imported: 0, skipped: 0, errors: [] };

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];
  const limit = options.limit ?? 20;

  try {
    const feedUrl = youtubeFeedUrl(author.youtubeChannelId);
    const items = filterItemsSince(await fetchRssFeedItems(feedUrl, 50), options.since);

    for (const item of items.slice(0, limit)) {
      const videoId = item.link ? youtubeVideoIdFromUrl(item.link) : null;
      if (!videoId) {
        skipped += 1;
        continue;
      }
      const sourceUrl = youtubeWatchUrl(videoId);
      const existing = await prisma.editorialCuratedItem.findUnique({ where: { sourceUrl } });
      if (existing) {
        skipped += 1;
        continue;
      }

      if (options.dryRun) {
        console.log(`[dry-run] video: ${item.title} (${sourceUrl})`);
        imported += 1;
        continue;
      }

      const slug = await ensureUniqueCuratedSlug(prisma, item.title);
      await prisma.editorialCuratedItem.create({
        data: {
          slug,
          kind: "VIDEO",
          title: item.title,
          summary: truncateSummary(item.summary ?? item.contentHtml ?? "", 400),
          embedUrl: youtubeEmbedUrl(videoId),
          sourceUrl,
          coverUrl: item.imageUrl ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          publishedAt: item.pubDate ?? new Date(),
          locale: "es",
          editorialAuthorId: author.id,
          metadata: {
            episodeGuid: item.guid,
            lastSyncedAt: new Date().toISOString(),
          },
        },
      });
      imported += 1;
    }
  } catch (error) {
    errors.push(`${author.slug} video: ${error instanceof Error ? error.message : String(error)}`);
  }

  return { imported, skipped, errors };
}

async function syncPodcastForAuthor(
  author: {
    id: string;
    slug: string;
    name: string;
    podcastFeedUrls: string[];
  },
  options: SyndicationOptions,
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];
  const limit = options.limit ?? 20;

  for (const feedUrl of author.podcastFeedUrls) {
    try {
      const items = filterItemsSince(await fetchRssFeedItems(feedUrl, 50), options.since);
      for (const item of items.slice(0, limit)) {
        const sourceUrl = (item.link ?? item.enclosureUrl)?.trim();
        if (!sourceUrl) {
          skipped += 1;
          continue;
        }

        const existing = await prisma.editorialCuratedItem.findUnique({ where: { sourceUrl } });
        if (existing) {
          skipped += 1;
          continue;
        }

        if (options.dryRun) {
          console.log(`[dry-run] podcast: ${item.title} (${sourceUrl})`);
          imported += 1;
          continue;
        }

        const slug = await ensureUniqueCuratedSlug(prisma, item.title);
        await prisma.editorialCuratedItem.create({
          data: {
            slug,
            kind: "PODCAST",
            title: item.title,
            summary: truncateSummary(item.summary ?? item.contentHtml ?? "", 500),
            embedUrl: item.enclosureUrl ?? null,
            sourceUrl,
            coverUrl: item.imageUrl ?? null,
            durationSecs: parseDurationToSecs(item.duration),
            publishedAt: item.pubDate ?? new Date(),
            locale: "es",
            editorialAuthorId: author.id,
            metadata: {
              episodeGuid: item.guid,
              lastSyncedAt: new Date().toISOString(),
            },
          },
        });
        imported += 1;
      }
    } catch (error) {
      errors.push(`${author.slug} podcast feed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { imported, skipped, errors };
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function runBlogSyndication(options: SyndicationOptions): Promise<SyndicationResult[]> {
  const authors = await prisma.editorialAuthor.findMany({
    where: options.writerSlug ? { slug: options.writerSlug } : undefined,
    orderBy: { sortOrder: "asc" },
  });

  if (!authors.length) {
    throw new Error(options.writerSlug ? `Autor no encontrado: ${options.writerSlug}` : "No hay autores editoriales");
  }

  const kinds: Array<"written" | "video" | "podcast"> =
    options.kind === "all" ? ["written", "video", "podcast"] : [options.kind];

  const results: SyndicationResult[] = [];

  for (const kind of kinds) {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const author of authors) {
      if (kind === "written") {
        const r = await syncWrittenForAuthor(author, options);
        imported += r.imported;
        skipped += r.skipped;
        errors.push(...r.errors);
      } else if (kind === "video") {
        const r = await syncVideoForAuthor(author, options);
        imported += r.imported;
        skipped += r.skipped;
        errors.push(...r.errors);
      } else if (kind === "podcast") {
        const r = await syncPodcastForAuthor(author, options);
        imported += r.imported;
        skipped += r.skipped;
        errors.push(...r.errors);
      }
    }

    results.push({ kind, imported, skipped, errors });
  }

  return results;
}

export type { RssFeedItem };
