import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import BlogPodcastCard from "@/components/blog/BlogPodcastCard";
import BlogSectionTabs from "@/components/blog/BlogSectionTabs";
import BlogVideoCard from "@/components/blog/BlogVideoCard";
import BlogWrittenCard from "@/components/blog/BlogWrittenCard";
import { getAuthorContent } from "@/lib/blog/catalog";
import type { AppLocale } from "@/i18n/routing";
import type { BlogSection } from "@/types/editorial-author";

export const dynamic = "force-dynamic";

type Props = {
  params: { locale: AppLocale; slug: string };
  searchParams: { section?: string };
};

function parseSection(value?: string): BlogSection {
  if (value === "video" || value === "podcast") return value;
  return "written";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getAuthorContent(params.slug, "written", params.locale);
  if (!data?.author) return {};
  return {
    title: `${data.author.name} | Blog El Travieso`,
    description: data.author.tagline ?? data.author.bio.slice(0, 160),
  };
}

export default async function BlogAuthorPage({ params, searchParams }: Props) {
  const section = parseSection(searchParams.section);
  const t = await getTranslations({ locale: params.locale, namespace: "blog" });
  const data = await getAuthorContent(params.slug, section, params.locale);

  if (!data?.author) notFound();

  const { author, posts, curated } = data;
  const whyRead =
    author.metadata && typeof author.metadata === "object" && "whyRead" in author.metadata
      ? String((author.metadata as { whyRead?: string }).whyRead ?? "")
      : "";

  return (
    <main className="min-h-screen bg-[#FAFAFA] pt-32 pb-24">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <Link
          href="/blog/autores"
          className="mb-12 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-electric-blue"
        >
          ← {t("allAuthors")}
        </Link>

        <header className="mb-12 space-y-6 border-b border-white/10 pb-12">
          <div className="flex flex-wrap items-start gap-6">
            {author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={author.avatarUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-electric-yellow/20 font-display text-3xl font-bold text-electric-yellow">
                {author.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-electric-blue">{t("authorProfile")}</p>
              <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">{author.name}</h1>
              {author.tagline ? <p className="mt-2 text-xl text-electric-yellow italic">{author.tagline}</p> : null}
              <p className="mt-2 text-sm text-slate-500">
                {[author.city, author.country].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          {whyRead ? <p className="text-lg font-medium text-slate-300">{whyRead}</p> : null}
          <p className="max-w-3xl leading-relaxed text-slate-400">{author.bio}</p>
          <div className="flex flex-wrap gap-3">
            {author.websiteUrl ? (
              <a
                href={author.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-electric-blue/40"
              >
                Web
              </a>
            ) : null}
            {author.substackUrl ? (
              <a
                href={author.substackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-electric-blue/40"
              >
                Substack
              </a>
            ) : null}
          </div>
        </header>

        <div className="mb-10">
          <BlogSectionTabs active={section} basePath={`/blog/autores/${author.slug}`} />
        </div>

        {section === "written" && (
          posts.length === 0 ? (
            <p className="text-slate-400">{t("emptyWritten")}</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2">
              {posts.map((post) => (
                <BlogWrittenCard key={post.id} post={{ ...post, author: null, editorialAuthor: author }} excerptBadge={t("excerptBadge")} />
              ))}
            </div>
          )
        )}

        {section === "video" && (
          curated.length === 0 ? (
            <p className="text-slate-400">{t("emptyVideo")}</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2">
              {curated.map((item) => (
                <BlogVideoCard key={item.id} item={{ ...item, editorialAuthor: author }} />
              ))}
            </div>
          )
        )}

        {section === "podcast" && (
          curated.length === 0 ? (
            <p className="text-slate-400">{t("emptyPodcast")}</p>
          ) : (
            <div className="grid gap-6">
              {curated.map((item) => (
                <BlogPodcastCard key={item.id} item={{ ...item, editorialAuthor: author }} episodeLabel={t("episode")} />
              ))}
            </div>
          )
        )}
      </div>
    </main>
  );
}
