import prisma from "../lib/prisma";
import { ensureUniqueProductCode } from "../lib/products/product-code";

async function main() {
  const missing = await prisma.product.findMany({
    where: { productCode: null },
    select: { id: true, slug: true, title: true },
    orderBy: { createdAt: "asc" },
  });

  let updated = 0;
  for (const product of missing) {
    const productCode = await ensureUniqueProductCode(product.id);
    await prisma.product.update({
      where: { id: product.id },
      data: { productCode },
    });
    updated += 1;
    console.log(`  ${product.slug} → ${productCode}`);
  }

  console.log(`✓ ${updated} productos con código ET-PROD-*****`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
