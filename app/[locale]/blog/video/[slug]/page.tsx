import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCuratedItemBySlug } from "@/lib/blog/catalog";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string; locale: AppLocale } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getCuratedItemBySlug(params.slug, "VIDEO");
  if (!item) return {};
  return {
    title: `${item.title} | Blog El Travieso`,
    description: item.summary?.slice(0, 160),
    alternates: item.sourceUrl ? { canonical: item.sourceUrl } : undefined,
  };
}

export default async function BlogVideoPage({ params }: Props) {
  const item = await getCuratedItemBySlug(params.slug, "VIDEO");
  if (!item) notFound();

  const t = await getTranslations({ locale: params.locale, namespace: "blog" });
  const date = item.publishedAt ?? item.createdAt;

  return (
    <main className="min-h-screen bg-[#FAFAFA] pt-32 pb-24">
      <div className="mx-auto max-w-4xl px-6 sm:px-8">
        <Link
          href="/blog?section=video"
          className="mb-12 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-electric-blue"
        >
          ← {t("backToBlog")}
        </Link>

        <article className="space-y-8">
          <header className="space-y-4 border-b border-white/10 pb-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-electric-red">{t("sections.video")}</p>
            <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{item.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Link href={`/blog/autores/${item.editorialAuthor.slug}`} className="hover:text-electric-blue">
                {item.editorialAuthor.name}
              </Link>
              <span>—</span>
              <time>
                {new Date(date).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </div>
          </header>

          {item.embedUrl ? (
            <div className="aspect-video overflow-hidden rounded-[2rem] border border-white/10 bg-black">
              <iframe
                src={item.embedUrl}
                title={item.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}

          {item.summary ? <p className="leading-relaxed text-slate-300">{item.summary}</p> : null}

          <aside className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              {t("videoNotice", { author: item.editorialAuthor.name })}
            </p>
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-sm font-bold uppercase tracking-widest text-electric-blue hover:text-electric-yellow"
            >
              {t("watchOriginal")} →
            </a>
          </aside>
        </article>
      </div>
    </main>
  );
}
