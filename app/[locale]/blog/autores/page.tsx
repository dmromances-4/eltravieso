import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import EditorialAuthorCard from "@/components/blog/EditorialAuthorCard";
import { listAllAuthors } from "@/lib/blog/catalog";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = { params: { locale: AppLocale } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "blog" });
  return {
    title: `${t("allAuthors")} | Blog El Travieso`,
    description: t("voicesLead"),
  };
}

export default async function BlogAuthorsPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "blog" });
  const authors = await listAllAuthors();

  return (
    <main className="min-h-screen bg-[#FAFAFA] pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <Link
          href="/blog"
          className="mb-12 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-electric-blue"
        >
          ← {t("backToBlog")}
        </Link>
        <div className="mb-12 space-y-4">
          <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">{t("voices")}</h1>
          <p className="max-w-2xl text-lg text-slate-400">{t("voicesLead")}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <EditorialAuthorCard key={author.id} author={author} />
          ))}
        </div>
      </div>
    </main>
  );
}
