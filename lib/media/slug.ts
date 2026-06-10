import { slugify } from "@/lib/utils/slug";

type SlugClient = {
  mediaItem: { findUnique: (args: { where: { slug: string } }) => Promise<{ id: string } | null> };
  liveStream: { findUnique: (args: { where: { slug: string } }) => Promise<{ id: string } | null> };
};

export async function ensureUniqueMediaSlug(
  prisma: SlugClient,
  title: string,
  table: "mediaItem" | "liveStream" = "mediaItem",
) {
  const base = slugify(title) || `media-${Date.now()}`;
  let slug = base;
  let index = 1;
  while (await prisma[table].findUnique({ where: { slug } })) {
    slug = `${base}-${index}`;
    index += 1;
  }
  return slug;
}
