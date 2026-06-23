import { slugify } from "@/lib/utils/slug";

type SlugClient = {
  blogPost: { findUnique: (args: { where: { slug: string } }) => Promise<{ id: string } | null> };
  editorialCuratedItem: { findUnique: (args: { where: { slug: string } }) => Promise<{ id: string } | null> };
};

export async function ensureUniqueCuratedSlug(prisma: SlugClient, title: string) {
  const base = slugify(title) || `item-${Date.now()}`;
  let slug = base;
  let index = 1;
  while (
    (await prisma.blogPost.findUnique({ where: { slug } })) ||
    (await prisma.editorialCuratedItem.findUnique({ where: { slug } }))
  ) {
    slug = `${base}-${index}`;
    index += 1;
  }
  return slug;
}

export function youtubeVideoIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0] || null;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/");
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
      const shortsIdx = parts.indexOf("shorts");
      if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeFeedUrl(channelId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}

export function parseDurationToSecs(raw?: string): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const parts = trimmed.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}
