import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils/slug";
import type { Prisma, ProductCategory } from "@prisma/client";

export type CatalogUpsertInput = {
  title: string;
  slugBase: string;
  sku: string;
  priceCents: number;
  stock: number;
  description?: string | null;
  imageUrl?: string | null;
  category?: ProductCategory;
  barProfileId: string;
  metadata: Prisma.InputJsonValue;
};

export type CatalogUpsertResult = {
  productId: string;
  variantId: string;
};

async function upsertBarStock(
  barProfileId: string,
  productId: string,
  variantId: string,
  initialUnits: number,
) {
  const profile = await prisma.barProfile.findUnique({
    where: { id: barProfileId },
    select: { autoReorderThreshold: true },
  });

  await prisma.barStock.upsert({
    where: {
      barProfileId_productId_variantId: {
        barProfileId,
        productId,
        variantId,
      },
    },
    create: {
      barProfileId,
      productId,
      variantId,
      currentUnits: initialUnits,
      minThreshold: profile?.autoReorderThreshold ?? 0,
      lastSyncedAt: new Date(),
    },
    update: {
      lastSyncedAt: new Date(),
    },
  });
}

export async function upsertCatalogItem(input: CatalogUpsertInput): Promise<CatalogUpsertResult> {
  const slug = slugify(input.slugBase) || `item-${Date.now()}`;
  const category = input.category ?? "INGREDIENTE";

  const existingVariant = await prisma.productVariant.findUnique({
    where: { sku: input.sku },
    include: { product: true },
  });

  if (existingVariant) {
    await prisma.product.update({
      where: { id: existingVariant.productId },
      data: {
        title: input.title,
        description: input.description ?? existingVariant.product.description,
        imageUrl: input.imageUrl ?? existingVariant.product.imageUrl,
        metadata: input.metadata,
      },
    });
    await prisma.productVariant.update({
      where: { id: existingVariant.id },
      data: {
        priceCents: input.priceCents,
        stock: input.stock,
      },
    });
    await upsertBarStock(
      input.barProfileId,
      existingVariant.productId,
      existingVariant.id,
      input.stock,
    );
    return { productId: existingVariant.productId, variantId: existingVariant.id };
  }

  const uniqueSlug = `${slug}-${input.sku.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`.slice(0, 80);
  const product = await prisma.product.create({
    data: {
      title: input.title,
      slug: uniqueSlug,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      category,
      type: "CONSUMABLE",
      channel: "B2B",
      metadata: input.metadata,
      variants: {
        create: {
          sku: input.sku,
          format: "UNIT",
          channel: "B2B",
          priceCents: input.priceCents,
          stock: input.stock,
        },
      },
    },
    include: { variants: true },
  });

  const variant = product.variants[0];
  if (!variant) {
    throw new Error("Failed to create product variant during catalog sync.");
  }

  await upsertBarStock(input.barProfileId, product.id, variant.id, input.stock);

  return { productId: product.id, variantId: variant.id };
}
