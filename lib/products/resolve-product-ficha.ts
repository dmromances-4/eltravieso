import type { AppLocale } from "@/i18n/routing";
import type { Product, ProductVariant } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getAlcoholBySlug } from "@/lib/alcohol/catalog";
import { getCatalogRecipes } from "@/lib/recipes/catalog";
import { normalizeMatchText, tokenizeForMatch } from "@/lib/recipes/match-products";
import type { AlcoholRecord } from "@/types/alcohol";

export type ProductFichaVariant = {
  id: string;
  sku: string;
  format: string;
  priceCents: number;
  wholesaleCents: number | null;
  stock: number;
  barcode: string | null;
  isActive: boolean;
};

export type ProductFichaRecipeLink = {
  slug: string;
  title: string;
};

export type ProductFichaDTO = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  type: string;
  imageUrl: string | null;
  galleryUrls: string[];
  abv: number | null;
  volumeMl: number | null;
  weightGrams: number | null;
  productCode: string | null;
  sourceUrl: string | null;
  affiliateUrl: string | null;
  affiliatePlatform: string;
  partnerName: string | null;
  variants: ProductFichaVariant[];
  encyclopedia: AlcoholRecord | null;
  relatedRecipes: ProductFichaRecipeLink[];
};

function mapVariant(v: ProductVariant): ProductFichaVariant {
  return {
    id: v.id,
    sku: v.sku,
    format: v.format,
    priceCents: v.priceCents,
    wholesaleCents: v.wholesaleCents,
    stock: v.stock,
    barcode: v.barcode,
    isActive: v.isActive,
  };
}

async function findRelatedRecipes(
  product: Product,
  locale: AppLocale,
): Promise<ProductFichaRecipeLink[]> {
  const catalog = await getCatalogRecipes(locale);
  const productTokens = tokenizeForMatch(`${product.title} ${product.slug}`);
  const metadataTerms =
    product.metadata && typeof product.metadata === "object"
      ? ((product.metadata as Record<string, unknown>).matchTerms as string[] | undefined) ?? []
      : [];

  const haystackTerms = [
    ...productTokens,
    ...metadataTerms.map((t) => normalizeMatchText(String(t))),
    normalizeMatchText(product.slug.replace(/^ingrediente-/, "")),
  ].filter(Boolean);

  const matches: ProductFichaRecipeLink[] = [];
  for (const recipe of catalog) {
    const recipeHaystack = normalizeMatchText(
      `${recipe.title} ${recipe.ingredients.join(" ")}`,
    );
    const hit = haystackTerms.some(
      (term) => term.length > 3 && recipeHaystack.includes(term),
    );
    if (hit) {
      matches.push({ slug: recipe.slug, title: recipe.title });
    }
    if (matches.length >= 6) break;
  }
  return matches;
}

export async function resolveProductFicha(
  slug: string,
  locale: AppLocale = "es",
): Promise<ProductFichaDTO | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      variants: { orderBy: { priceCents: "asc" } },
      partner: { select: { name: true } },
    },
  });

  if (!product) return null;

  const encyclopedia =
    (product.encyclopediaSlug
      ? getAlcoholBySlug(product.encyclopediaSlug, locale)
      : null) ?? getAlcoholBySlug(product.slug, locale);

  const relatedRecipes = await findRelatedRecipes(product, locale);

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    category: product.category,
    type: product.type,
    imageUrl: product.imageUrl,
    galleryUrls: product.galleryUrls ?? [],
    abv: product.abv,
    volumeMl: product.volumeMl,
    weightGrams: product.weightGrams,
    productCode: product.productCode,
    sourceUrl: product.sourceUrl,
    affiliateUrl: product.affiliateUrl,
    affiliatePlatform: product.affiliatePlatform,
    partnerName: product.partner?.name ?? null,
    variants: product.variants.map(mapVariant),
    encyclopedia,
    relatedRecipes,
  };
}
