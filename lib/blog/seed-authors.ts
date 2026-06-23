import prisma from "@/lib/prisma";
import { getAllWriters } from "@/lib/blog/authors-catalog";

export async function seedBlogAuthors(): Promise<{ upserted: number }> {
  const writers = getAllWriters();
  let upserted = 0;

  for (const writer of writers) {
    await prisma.editorialAuthor.upsert({
      where: { slug: writer.slug },
      create: {
        slug: writer.slug,
        name: writer.name,
        tagline: writer.tagline,
        bio: writer.bio,
        country: writer.country,
        city: writer.city ?? null,
        specialties: writer.specialties,
        tier: writer.tier,
        avatarUrl: writer.avatarUrl ?? null,
        websiteUrl: writer.websiteUrl ?? null,
        substackUrl: writer.substackUrl ?? null,
        twitterUrl: writer.twitterUrl ?? null,
        writtenFeedUrls: writer.writtenFeedUrls ?? [],
        youtubeChannelId: writer.youtubeChannelId ?? null,
        podcastFeedUrls: writer.podcastFeedUrls ?? [],
        featured: writer.featured ?? false,
        sortOrder: writer.sortOrder ?? 99,
        metadata: { whyRead: writer.whyRead, bioEn: writer.bioEn ?? null },
      },
      update: {
        name: writer.name,
        tagline: writer.tagline,
        bio: writer.bio,
        country: writer.country,
        city: writer.city ?? null,
        specialties: writer.specialties,
        tier: writer.tier,
        avatarUrl: writer.avatarUrl ?? null,
        websiteUrl: writer.websiteUrl ?? null,
        substackUrl: writer.substackUrl ?? null,
        twitterUrl: writer.twitterUrl ?? null,
        writtenFeedUrls: writer.writtenFeedUrls ?? [],
        youtubeChannelId: writer.youtubeChannelId ?? null,
        podcastFeedUrls: writer.podcastFeedUrls ?? [],
        featured: writer.featured ?? false,
        sortOrder: writer.sortOrder ?? 99,
        metadata: { whyRead: writer.whyRead, bioEn: writer.bioEn ?? null },
      },
    });
    upserted += 1;
  }

  return { upserted };
}
