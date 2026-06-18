import type { Metadata } from "next";
import BibliotecaClient from "@/components/biblioteca/BibliotecaClient";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { getAllBooks } from "@/lib/books/catalog";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: { locale: AppLocale } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "biblioteca" });
  return {
    title: `${t("title")} | El Travieso`,
    description: t("subtitle"),
    alternates: {
      languages: { es: "/biblioteca", en: "/en/biblioteca" },
    },
  };
}

export default async function BibliotecaPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "biblioteca" });
  const books = getAllBooks(params.locale);

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-slate-900">
      <section className="pt-24 pb-8">
        <div className="section-shell">
          <PageHero eyebrow={t("title")} title={t("title")} lead={t("subtitle")} />
        </div>
      </section>
      <Section compact>
        <BibliotecaClient books={books} />
      </Section>
    </main>
  );
}
