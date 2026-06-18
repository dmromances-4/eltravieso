import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalPage from "@/components/legal/LegalPage";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: { locale: AppLocale } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "legal.legalNotice" });
  return { title: `${t("title")} | El Travieso`, description: t("metaDescription") };
}

export default function AvisoLegalPage({ params }: Props) {
  return <LegalPage page="aviso-legal" locale={params.locale} namespace="legalNotice" />;
}
