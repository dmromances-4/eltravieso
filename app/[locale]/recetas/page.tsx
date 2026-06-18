import type { Metadata } from "next";
import RecetasClient from "@/components/recetas/RecetasClient";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { getCatalogRecipes } from "@/lib/recipes/catalog";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
  params: { locale: AppLocale };
  searchParams?: { q?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "recipes" });
  return {
    title: `${t("title")} | El Travieso`,
    description: t("searchPlaceholder"),
    alternates: {
      languages: { es: "/recetas", en: "/en/recetas" },
    },
  };
}

export default async function CocktailsPage({ params, searchParams }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "recipes" });
  const cocktails = await getCatalogRecipes(params.locale);
  const initialQuery = searchParams?.q?.trim() ?? "";

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-slate-900">
      <section className="pt-24 pb-8">
        <div className="section-shell">
          <PageHero eyebrow={t("title")} title={t("title")} lead={t("searchPlaceholder")} />
        </div>
      </section>
      <Section compact>
        <RecetasClient recipes={cocktails} initialQuery={initialQuery} />
      </Section>
    </main>
  );
}
