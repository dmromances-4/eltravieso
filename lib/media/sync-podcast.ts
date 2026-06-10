import prisma from "@/lib/prisma";
import { fetchRssEpisodes } from "@/lib/media/rss";
import { ensureUniqueMediaSlug } from "@/lib/media/slug";

export async function syncPodcastFeed(feedId: string) {
  const feed = await prisma.podcastFeed.findUnique({
    where: { id: feedId },
    include: { show: true },
  });
  if (!feed) throw new Error("Feed no encontrado");
  if (!feed.syncEnabled) return { imported: 0, skipped: true };

  try {
    const episodes = await fetchRssEpisodes(feed.rssUrl, 100);
    let imported = 0;

    for (const ep of episodes) {
      const existing = await prisma.mediaItem.findFirst({
        where: { parentId: feed.mediaItemId, episodeGuid: ep.guid },
      });
      if (existing) continue;

      const slug = await ensureUniqueMediaSlug(prisma, `${feed.show.title}-${ep.title}`);
      await prisma.mediaItem.create({
        data: {
          title: ep.title,
          slug,
          kind: "PODCAST_EPISODE",
          summary: ep.summary ?? null,
          mediaUrl: ep.mediaUrl ?? null,
          sourceType: "EMBED",
          parentId: feed.mediaItemId,
          episodeGuid: ep.guid,
          status: feed.show.status,
          publishedAt: ep.pubDate ?? feed.show.publishedAt,
          createdById: feed.show.createdById,
          metadata: { duration: ep.duration, pubDate: ep.pubDate?.toISOString() },
        },
      });
      imported += 1;
    }

    await prisma.podcastFeed.update({
      where: { id: feedId },
      data: { lastSyncedAt: new Date(), lastError: null },
    });

    return { imported, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error RSS";
    await prisma.podcastFeed.update({
      where: { id: feedId },
      data: { lastError: message },
    });
    throw error;
  }
}

export async function syncAllPodcastFeeds() {
  const feeds = await prisma.podcastFeed.findMany({ where: { syncEnabled: true } });
  const results = [];
  for (const feed of feeds) {
    try {
      results.push({ feedId: feed.id, ...(await syncPodcastFeed(feed.id)) });
    } catch (error) {
      results.push({
        feedId: feed.id,
        error: error instanceof Error ? error.message : "Error",
      });
    }
  }
  return results;
}
