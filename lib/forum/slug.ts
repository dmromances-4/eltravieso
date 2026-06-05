import { slugify } from "@/lib/utils/slug";

export async function ensureUniqueForumSlug(
  prisma: { forumTopic: { findUnique: (args: { where: { slug: string } }) => Promise<{ id: string } | null> } },
  title: string,
) {
  const base = slugify(title) || `tema-${Date.now()}`;
  let slug = base;
  let index = 1;
  while (await prisma.forumTopic.findUnique({ where: { slug } })) {
    slug = `${base}-${index}`;
    index += 1;
  }
  return slug;
}
