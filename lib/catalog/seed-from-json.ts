import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import type { NormalizedProduct } from "@/scripts/build-products";
import type { CocktailRecord } from "@/types/cocktail";
import type { SyncPhaseResult } from "@/lib/catalog/sync-report";

const FALLBACK_PRICE: Record<string, number> = {
  VERMUT: 1290,
  ALCOHOL: 1490,
  SIROPE: 790,
  SODA: 350,
  CRISTALERIA: 990,
  MATERIAL: 1490,
  ROPA: 2490,
  MERCH: 1990,
  COCTELERIA: 2990,
  INGREDIENTE: 490,
  CONSERVA_LATERIO: 690,
};

function typeForCategory(category: string): "CONSUMABLE" | "MERCH" | "CONSERVA" {
  if (category === "CONSERVA_LATERIO") return "CONSERVA";
  if (category === "MERCH" || category === "ROPA" || category === "MATERIAL" || category === "CRISTALERIA")
    return "MERCH";
  return "CONSUMABLE";
}

function readJson<T>(rel: string, fallback: T): T {
  const file = path.resolve(process.cwd(), rel);
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export async function upsertProductFromJson(input: {
  title: string;
  slug: string;
  description: string | null;
  category: string;
  priceCents: number;
  imageUrl: string | null;
  format: string;
  volumeMl: number | null;
  skuPrefix?: string;
  stock?: number;
}) {
  const skuPrefix = input.skuPrefix ?? "CAT";
  const price = input.priceCents > 0 ? input.priceCents : FALLBACK_PRICE[input.category] ?? 990;
  const product = await prisma.product.upsert({
    where: { slug: input.slug },
    update: {
      title: input.title,
      description: input.description,
      type: typeForCategory(input.category) as never,
      category: input.category as never,
      imageUrl: input.imageUrl,
      volumeMl: input.volumeMl,
      isActive: true,
    },
    create: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      type: typeForCategory(input.category) as never,
      category: input.category as never,
      channel: "BOTH",
      imageUrl: input.imageUrl,
      volumeMl: input.volumeMl,
      isActive: true,
    },
  });

  const sku = `${skuPrefix}-${input.slug}`.slice(0, 60);
  await prisma.productVariant.upsert({
    where: { sku },
    update: { priceCents: price, isActive: true },
    create: {
      productId: product.id,
      sku,
      format: input.format as never,
      channel: "B2C",
      priceCents: price,
      minOrderQty: 1,
      stock: input.stock ?? 100,
    },
  });

  return product;
}

export async function seedProductsFromJson(options?: {
  productsPath?: string;
}): Promise<SyncPhaseResult> {
  const products = readJson<NormalizedProduct[]>(options?.productsPath ?? "data/products.json", []);
  let added = 0;
  let skipped = 0;

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug }, select: { id: true } });
    await upsertProductFromJson({
      title: p.title,
      slug: p.slug,
      description: p.description,
      category: p.category,
      priceCents: p.priceCents,
      imageUrl: p.imageUrl,
      format: p.format,
      volumeMl: p.volumeMl,
    });
    if (existing) skipped += 1;
    else added += 1;
  }

  return { added, skipped, total: products.length, errors: 0 };
}

async function resolveCatalogAuthorId(): Promise<string> {
  let user = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (!user) {
    user = await prisma.user.findFirst({ select: { id: true } });
  }
  if (!user) {
    const created = await prisma.user.create({
      data: {
        email: "system@eltravieso.com",
        password: "hash_not_needed_for_system",
        name: "El Travieso Bot",
        role: "ADMIN",
      },
      select: { id: true },
    });
    return created.id;
  }
  return user.id;
}

export async function upsertRecipeFromJson(recipe: CocktailRecord, authorId: string) {
  const ingredients = JSON.stringify(recipe.ingredients ?? []);
  const existing = await prisma.recipe.findUnique({ where: { slug: recipe.slug } });
  if (existing) {
    await prisma.recipe.update({
      where: { slug: recipe.slug },
      data: {
        title: recipe.title,
        ingredients,
        method: recipe.method ?? null,
        authorId,
        isPublished: true,
      },
    });
    return { created: false };
  }

  await prisma.recipe.create({
    data: {
      title: recipe.title,
      slug: recipe.slug,
      summary: `Receta del catálogo El Travieso: ${recipe.title}.`,
      ingredients,
      method: recipe.method ?? "Mezclar con hielo y servir bien frío.",
      authorId,
      isPublished: true,
      tags: ["catalogo"],
    },
  });
  return { created: true };
}

export async function seedRecipesFromJson(options?: {
  cocktailsPath?: string;
}): Promise<SyncPhaseResult> {
  const cocktailsPath = options?.cocktailsPath ?? "data/cocktails.json";
  const records = readJson<CocktailRecord[]>(cocktailsPath, []);
  const authorId = await resolveCatalogAuthorId();

  let added = 0;
  let skipped = 0;

  for (const recipe of records) {
    const { created } = await upsertRecipeFromJson(recipe, authorId);
    if (created) added += 1;
    else skipped += 1;
  }

  return { added, skipped, total: records.length, errors: 0 };
}

export async function seedCatalogFromJson(options?: {
  products?: boolean;
  recipes?: boolean;
}): Promise<{ products?: SyncPhaseResult; recipes?: SyncPhaseResult }> {
  const result: { products?: SyncPhaseResult; recipes?: SyncPhaseResult } = {};
  if (options?.products !== false) {
    result.products = await seedProductsFromJson();
  }
  if (options?.recipes !== false) {
    result.recipes = await seedRecipesFromJson();
  }
  return result;
}
