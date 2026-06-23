import { getTranslations } from "next-intl/server";

type Props = {
  authorName: string;
  sourceUrl: string;
  publisher?: string | null;
  publishedAt?: Date | null;
};

export default async function BlogSyndicationFooter({ authorName, sourceUrl, publisher, publishedAt }: Props) {
  const t = await getTranslations("blog");
  const dateStr = publishedAt
    ? publishedAt.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const where = [publisher, dateStr].filter(Boolean).join(", ");

  return (
    <aside className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 not-prose">
      <p className="text-sm leading-relaxed text-slate-400">
        {t("syndicationNotice", { author: authorName, where: where || t("originalSource") })}
      </p>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex text-sm font-bold uppercase tracking-widest text-electric-blue hover:text-electric-yellow"
      >
        {t("readFullArticle")} →
      </a>
    </aside>
  );
}
