import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import BlogSyndicationFooter from "@/components/blog/BlogSyndicationFooter";
import { getAuthSession } from "@/lib/auth/session";
import { isPremiumContentLocked } from "@/lib/blog/premium";
import prisma from "@/lib/prisma";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string; locale: AppLocale } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.blogPost.findFirst({
    where: { slug: params.slug, locale: params.locale },
    include: { editorialAuthor: true },
  });
  if (!post) return {};
  const description = (post.excerpt ?? post.content).substring(0, 160).replace(/<[^>]*>?/gm, "");
  const metadata: Metadata = {
    title: `${post.title} | Blog Vermut El Travieso`,
    description,
  };
  if (post.ingestionType === "syndicated" && post.canonicalUrl) {
    metadata.alternates = { canonical: post.canonicalUrl };
  }
  return metadata;
}

export default async function BlogPostPage({ params }: Props) {
  const post = await prisma.blogPost.findFirst({
    where: { slug: params.slug, locale: params.locale },
    include: { author: true, editorialAuthor: true },
  });

  if (!post || !post.published) {
    notFound();
  }

  const t = await getTranslations({ locale: params.locale, namespace: "blog" });
  const session = await getAuthSession();
  const isVip = Boolean(session?.user?.isVip);
  const locked = isPremiumContentLocked(post.isPremium, isVip);
  const authorName = post.editorialAuthor?.name ?? post.author?.name ?? "Desconocido";
  const displayDate = post.sourcePublishedAt ?? post.publishedAt ?? post.createdAt;
  const metadata = post.metadata as { sourcePublisher?: string } | null;

  return (
    <main className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 sm:px-8">
        <Link
          href="/blog"
          className="group mb-12 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-electric-blue"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span> {t("backToBlog")}
        </Link>

        <article className="space-y-12">
          <header className="space-y-6 border-b border-white/10 pb-12">
            {post.ingestionType === "syndicated" ? (
              <span className="inline-flex rounded-full border border-electric-blue/30 bg-electric-blue/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-electric-blue">
                {t("excerptBadge")}
              </span>
            ) : null}
            <h1 className="text-4xl font-display font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              {post.editorialAuthor ? (
                <Link href={`/blog/autores/${post.editorialAuthor.slug}`} className="flex items-center gap-2 hover:text-electric-blue">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-electric-blue/20 text-electric-blue">
                    {authorName.charAt(0)}
                  </span>
                  {authorName}
                </Link>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-electric-blue/20 text-electric-blue">
                    {authorName.charAt(0)}
                  </span>
                  {authorName}
                </span>
              )}
              <span>—</span>
              <time>
                {new Date(displayDate).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </div>
            {post.isPremium ? (
              <p className="inline-flex rounded-full border border-electric-red/40 bg-electric-red/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-electric-red">
                Contenido Club VIP
              </p>
            ) : null}
          </header>

          {locked ? (
            <div className="space-y-4 rounded-[2rem] border border-electric-red/30 bg-electric-red/10 p-8 backdrop-blur-xl">
              <h2 className="font-display text-2xl font-bold text-white">Artículo premium</h2>
              {post.excerpt ? (
                <p className="leading-relaxed text-slate-300">{post.excerpt}</p>
              ) : (
                <p className="text-slate-300">
                  Este artículo incluye fichas técnicas de destilados raros y contenido exclusivo del club.
                </p>
              )}
              <Link
                href="/cuenta/membresia"
                className="inline-flex items-center justify-center rounded-full bg-electric-red px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white"
              >
                Unirme al Club de la Trastienda
              </Link>
            </div>
          ) : (
            <>
              <div
                className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-a:text-electric-blue prose-a:no-underline hover:prose-a:text-electric-yellow prose-blockquote:border-l-electric-blue prose-blockquote:bg-white/5 prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:rounded-r-2xl prose-blockquote:font-medium prose-blockquote:italic"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
              {post.ingestionType === "syndicated" && post.sourceUrl ? (
                <BlogSyndicationFooter
                  authorName={authorName}
                  sourceUrl={post.sourceUrl}
                  publisher={metadata?.sourcePublisher}
                  publishedAt={post.sourcePublishedAt}
                />
              ) : null}
            </>
          )}
        </article>
      </div>
    </main>
  );
}
