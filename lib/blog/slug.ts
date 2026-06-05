import { slugify } from "@/lib/utils/slug";

export async function ensureUniqueBlogSlug(
  prisma: { blogPost: { findUnique: (args: { where: { slug: string } }) => Promise<{ id: string } | null> } },
  title: string,
) {
  const base = slugify(title) || `post-${Date.now()}`;
  let slug = base;
  let index = 1;
  while (await prisma.blogPost.findUnique({ where: { slug } })) {
    slug = `${base}-${index}`;
    index += 1;
  }
  return slug;
}

export { slugify as slugifyBlogTitle };
