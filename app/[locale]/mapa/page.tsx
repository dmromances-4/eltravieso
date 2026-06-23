import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import MapaPageClient from "@/components/map/MapaPageClient";
import type { AppLocale } from "@/i18n/routing";

export const revalidate = 3600;

type Props = {
  params: { locale: AppLocale };
  searchParams?: { slug?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "map" });
  return {
    title: `${t("title")} | El Travieso`,
    description: t("searchPlaceholder"),
    alternates: {
      languages: { es: "/mapa", en: "/en/mapa" },
    },
  };
}

export default function MapaPage({ params, searchParams }: Props) {
  setRequestLocale(params.locale);
  const initialSlug = searchParams?.slug?.trim() || null;
  return <MapaPageClient initialSlug={initialSlug} />;
}
