import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import BlogSectionTabs from "@/components/blog/BlogSectionTabs";
import BlogPodcastCard from "@/components/blog/BlogPodcastCard";
import BlogVideoCard from "@/components/blog/BlogVideoCard";
import BlogVoicesSection from "@/components/blog/BlogVoicesSection";
import BlogWrittenCard from "@/components/blog/BlogWrittenCard";
import {
  listCuratedItems,
  listFeaturedAuthors,
  listWrittenPosts,
} from "@/lib/blog/catalog";
import type { AppLocale } from "@/i18n/routing";
import type { BlogSection } from "@/types/editorial-author";

export const dynamic = "force-dynamic";

type Props = {
  params: { locale: AppLocale };
  searchParams: { section?: string };
};

function parseSection(value?: string): BlogSection {
  if (value === "video" || value === "podcast") return value;
  return "written";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "nav" });
  return {
    title: `${t("blog")} | El Travieso`,
    description: t("blog"),
    alternates: {
      languages: { es: "/blog", en: "/en/blog" },
    },
  };
}

export default async function BlogPage({ params, searchParams }: Props) {
  const section = parseSection(searchParams.section);
  const t = await getTranslations({ locale: params.locale, namespace: "blog" });

  const [featuredAuthors, writtenPosts, videoItems, podcastItems] = await Promise.all([
    listFeaturedAuthors(8),
    section === "written" ? listWrittenPosts(params.locale) : Promise.resolve([]),
    section === "video" ? listCuratedItems("VIDEO", params.locale) : Promise.resolve([]),
    section === "podcast" ? listCuratedItems("PODCAST", params.locale) : Promise.resolve([]),
  ]);

  const emptyMessage =
    section === "written"
      ? t("emptyWritten")
      : section === "video"
        ? t("emptyVideo")
        : t("emptyPodcast");

  return (
    <main className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="mb-12 space-y-4">
          <p className="inline-flex rounded-full border border-electric-blue/20 bg-electric-blue/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-electric-blue">
            Cultura Canalla
          </p>
          <h1 className="text-5xl font-display font-bold tracking-tight text-white sm:text-6xl">
            Diario de un <span className="text-electric-yellow italic pr-2">Travieso</span>.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-400">{t("lead")}</p>
        </div>

        <div className="mb-12">
          <BlogSectionTabs active={section} />
        </div>

        <BlogVoicesSection
          authors={featuredAuthors}
          title={t("voices")}
          viewAllHref="/blog/autores"
          viewAllLabel={t("allAuthors")}
        />

        {section === "written" && (
          writtenPosts.length === 0 ? (
            <p className="text-slate-400">{emptyMessage}</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {writtenPosts.map((post) => (
                <BlogWrittenCard key={post.id} post={post} excerptBadge={t("excerptBadge")} />
              ))}
            </div>
          )
        )}

        {section === "video" && (
          videoItems.length === 0 ? (
            <p className="text-slate-400">{emptyMessage}</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {videoItems.map((item) => (
                <BlogVideoCard key={item.id} item={item} />
              ))}
            </div>
          )
        )}

        {section === "podcast" && (
          podcastItems.length === 0 ? (
            <p className="text-slate-400">{emptyMessage}</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {podcastItems.map((item) => (
                <BlogPodcastCard key={item.id} item={item} episodeLabel={t("episode")} />
              ))}
            </div>
          )
        )}
      </div>
    </main>
  );
}
