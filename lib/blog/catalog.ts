import type { EditorialContentKind } from "@/types/editorial-author";
import type { BlogSection } from "@/types/editorial-author";
import prisma from "@/lib/prisma";
import type { AppLocale } from "@/i18n/routing";

export function sectionToKind(section: BlogSection): EditorialContentKind | null {
  if (section === "video") return "VIDEO";
  if (section === "podcast") return "PODCAST";
  return null;
}

export async function listFeaturedAuthors(limit = 8) {
  return prisma.editorialAuthor.findMany({
    where: { featured: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: limit,
  });
}

export async function listAllAuthors() {
  return prisma.editorialAuthor.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getAuthorBySlug(slug: string) {
  return prisma.editorialAuthor.findUnique({ where: { slug } });
}

export async function listWrittenPosts(locale: AppLocale, limit = 48) {
  return prisma.blogPost.findMany({
    where: { published: true, locale },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: {
      author: { select: { name: true } },
      editorialAuthor: { select: { slug: true, name: true, avatarUrl: true } },
    },
  });
}

export async function listCuratedItems(kind: EditorialContentKind, locale: AppLocale, limit = 48) {
  return prisma.editorialCuratedItem.findMany({
    where: { kind, locale },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: {
      editorialAuthor: { select: { slug: true, name: true, avatarUrl: true } },
    },
  });
}

export async function getCuratedItemBySlug(slug: string, kind: EditorialContentKind) {
  return prisma.editorialCuratedItem.findFirst({
    where: { slug, kind },
    include: { editorialAuthor: true },
  });
}

export async function getAuthorContent(slug: string, section: BlogSection, locale: AppLocale) {
  const author = await getAuthorBySlug(slug);
  if (!author) return null;

  if (section === "written") {
    const posts = await prisma.blogPost.findMany({
      where: { published: true, locale, editorialAuthorId: author.id },
      orderBy: { publishedAt: "desc" },
      take: 48,
    });
    return { author, posts, curated: [] };
  }

  const kind = sectionToKind(section);
  if (!kind) return { author, posts: [], curated: [] };

  const curated = await prisma.editorialCuratedItem.findMany({
    where: { editorialAuthorId: author.id, kind, locale },
    orderBy: { publishedAt: "desc" },
    take: 48,
  });
  return { author, posts: [], curated };
}

export function formatDuration(secs: number | null | undefined): string | null {
  if (!secs || secs <= 0) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}:${String(rm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
