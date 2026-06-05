import prisma from "@/lib/prisma";
import type { ProductVariant } from "@prisma/client";

export async function resolveVariantByTpvIdentifier(
  provider: string,
  identifier: string,
): Promise<ProductVariant | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  const bySku = await prisma.productVariant.findUnique({ where: { sku: trimmed } });
  if (bySku) return bySku;

  if (provider !== "square") return null;

  const normalized = trimmed.replace(/^#/, "");

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { metadata: { path: ["squareVariationId"], equals: trimmed } },
        { metadata: { path: ["squareVariationId"], equals: normalized } },
        { metadata: { path: ["squareItemId"], equals: trimmed } },
        { metadata: { path: ["squareItemId"], equals: normalized } },
      ],
    },
    include: { variants: { take: 1 } },
    take: 5,
  });

  for (const product of products) {
    const variant = product.variants[0];
    if (variant) return variant;
  }

  const fallbackSku = `SQUARE-${normalized.replace(/[^a-zA-Z0-9]/g, "")}`;
  if (fallbackSku !== trimmed) {
    return prisma.productVariant.findUnique({ where: { sku: fallbackSku } });
  }

  return null;
}
