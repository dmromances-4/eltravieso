import prisma from "@/lib/prisma";
import { formatProductCode, parseProductCodeSequence } from "@/lib/products/product-ids";

async function maxSequenceInUse(): Promise<number> {
  const rows = await prisma.product.findMany({
    where: { productCode: { not: null } },
    select: { productCode: true },
  });

  let max = 0;
  for (const row of rows) {
    max = Math.max(max, parseProductCodeSequence(row.productCode));
  }
  return max;
}

export async function allocateProductCode(): Promise<string> {
  const next = (await maxSequenceInUse()) + 1;
  return formatProductCode(next);
}

export async function ensureUniqueProductCode(excludeProductId?: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = await allocateProductCode();
    const conflict = await prisma.product.findFirst({
      where: {
        productCode: code,
        ...(excludeProductId ? { NOT: { id: excludeProductId } } : {}),
      },
      select: { id: true },
    });
    if (!conflict) return code;
  }
  throw new Error("No se pudo asignar un código de producto único.");
}
