import type { MediaKind, MediaPublishStatus, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export const publishedWhere = { status: "PUBLISHED" as MediaPublishStatus };

export async function listPublishedMedia(options?: {
  kind?: MediaKind | MediaKind[];
  q?: string;
  tag?: string;
  limit?: number;
}) {
  const kinds = options?.kind
    ? Array.isArray(options.kind)
      ? options.kind
      : [options.kind]
    : undefined;

  const where: Prisma.MediaItemWhereInput = {
    ...publishedWhere,
    ...(kinds ? { kind: { in: kinds } } : {}),
    ...(options?.tag ? { tags: { has: options.tag } } : {}),
    ...(options?.q
      ? {
          OR: [
            { title: { contains: options.q, mode: "insensitive" } },
            { summary: { contains: options.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prisma.mediaItem.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: options?.limit ?? 48,
    include: {
      barProfile: { select: { businessName: true, slug: true } },
    },
  });
}

export async function getPublishedMediaBySlug(slug: string) {
  return prisma.mediaItem.findFirst({
    where: { slug, ...publishedWhere },
    include: {
      episodes: {
        where: publishedWhere,
        orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }],
      },
      parent: true,
      barProfile: { select: { businessName: true, slug: true, city: true } },
      podcastFeed: true,
    },
  });
}

export async function listMediaForCocktailSlug(cocktailSlug: string, limit = 6) {
  try {
    return await prisma.mediaItem.findMany({
      where: {
        ...publishedWhere,
        cocktailSlugs: { has: cocktailSlug },
        kind: { in: ["FILM", "SERIES", "PODCAST_SHOW", "EVENT_VIDEO"] },
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[media/catalog] listMediaForCocktailSlug unavailable:", error);
    }
    return [];
  }
}

export async function listPublishedLiveStreams() {
  return prisma.liveStream.findMany({
    where: { status: "PUBLISHED", isLive: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getLiveStreamBySlug(slug: string) {
  return prisma.liveStream.findFirst({
    where: { slug, status: "PUBLISHED" },
  });
}
