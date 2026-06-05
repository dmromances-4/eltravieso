import prisma from "@/lib/prisma";
import { fetchHoldedStock } from "@/lib/holded/api";
import type { CheckoutItem } from "@/lib/stripe/api";

export type CartLineInput = {
  id: string;
  quantity: number;
};

export class CartValidationError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "CartValidationError";
  }
}

function isB2cChannel(channel: string) {
  return channel === "B2C" || channel === "BOTH";
}

export async function validateCartLines(lines: CartLineInput[]): Promise<CheckoutItem[]> {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new CartValidationError("No hay artículos en el carrito");
  }

  const normalized = lines.map((line, index) => {
    const id = String(line?.id ?? "").trim();
    const quantity = Math.floor(Number(line?.quantity));

    if (!id) {
      throw new CartValidationError(`Línea ${index + 1}: id de variante inválido`);
    }
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      throw new CartValidationError(`Línea ${index + 1}: cantidad inválida (1–99)`);
    }

    return { id, quantity };
  });

  const ids = [...new Set(normalized.map((l) => l.id))];
  if (ids.length !== normalized.length) {
    throw new CartValidationError("No se permiten variantes duplicadas en el carrito");
  }

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: ids } },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          isActive: true,
          channel: true,
        },
      },
    },
  });

  const byId = new Map(variants.map((v) => [v.id, v]));
  const checkoutItems: CheckoutItem[] = [];

  for (const line of normalized) {
    const variant = byId.get(line.id);
    if (!variant) {
      throw new CartValidationError("Uno o más productos del carrito no existen");
    }

    const product = variant.product;
    if (!product.isActive || !variant.isActive) {
      throw new CartValidationError(`"${product.title}" no está disponible`);
    }

    if (!isB2cChannel(product.channel) || !isB2cChannel(variant.channel)) {
      throw new CartValidationError(`"${product.title}" no está disponible para venta B2C`);
    }

    if (variant.stock < line.quantity) {
      throw new CartValidationError(`Stock insuficiente para "${product.title}"`);
    }

    try {
      const holdedStock = await fetchHoldedStock(variant.sku);
      const available = holdedStock.data?.[0]?.availableQuantity;
      if (typeof available === "number" && available < line.quantity) {
        throw new CartValidationError(`Stock Holded insuficiente para "${product.title}"`);
      }
    } catch (error) {
      if (error instanceof CartValidationError) throw error;
      if (process.env.HOLDED_API_KEY) {
        throw new CartValidationError("No se pudo verificar el stock en Holded");
      }
    }

    checkoutItems.push({
      id: variant.id,
      productId: product.id,
      sku: variant.sku,
      name: product.title,
      description: product.description ?? variant.format,
      amount: variant.priceCents,
      quantity: line.quantity,
      currency: variant.currency ?? "eur",
      image: product.imageUrl ?? undefined,
    });
  }

  return checkoutItems;
}
