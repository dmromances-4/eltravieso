import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import ShopClient from "./ShopClient";
import { getAllAlcohols } from '@/lib/alcohol/catalog';
import { getTranslations } from "next-intl/server";
import type { AppLocale } from '@/i18n/routing';
import { normalizeMatchText } from '@/lib/recipes/match-products';

export const dynamic = 'force-dynamic';

export const revalidate = 60;

type Props = { params: { locale: AppLocale } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "shop" });
  return {
    title: `${t("title")} | El Travieso`,
    description: t("metaDescription"),
    alternates: {
      languages: { es: "/shop", en: "/en/shop" },
    },
  };
}

export default async function ShopPage({ params }: Props) {
  const productsRaw = await prisma.product.findMany({
    where: { isActive: true },
    include: { variants: true },
    orderBy: { createdAt: 'desc' }
  });

  const realProducts = productsRaw.filter((p) => !p.slug.startsWith('ingrediente-'));
  const realMatchTerms = new Set(
    realProducts.flatMap((p) => {
      const terms: string[] = [normalizeMatchText(p.slug), normalizeMatchText(p.title)];
      if (p.metadata && typeof p.metadata === 'object') {
        const matchTerms = (p.metadata as Record<string, unknown>).matchTerms;
        if (Array.isArray(matchTerms)) {
          terms.push(...matchTerms.map((t) => normalizeMatchText(String(t))));
        }
      }
      return terms.filter((t) => t.length > 2);
    }),
  );

  const products = productsRaw
    .filter((p) => {
      if (!p.slug.startsWith('ingrediente-')) return true;
      const key = normalizeMatchText(p.slug.replace(/^ingrediente-/, ''));
      return !realMatchTerms.has(key);
    })
    .map(p => {
      const defaultVariant = p.variants.find(v => v.isActive) || p.variants[0];
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        priceCents: defaultVariant?.priceCents ?? 0,
        imageUrl: p.imageUrl,
        category: p.category,
        type: p.type,
      };
    });

  const linkedEncyclopediaSlugs = new Set(
    productsRaw
      .map((p) => p.encyclopediaSlug)
      .filter((slug): slug is string => Boolean(slug)),
  );

  const alcohols = getAllAlcohols(params.locale).filter(
    (entry) => !linkedEncyclopediaSlugs.has(entry.slug),
  );

  return (
    <main className="min-h-screen bg-[#FAFAFA] pt-24 pb-24 text-slate-900">
      <ShopClient products={products} alcohols={alcohols} />
    </main>
  );
}
