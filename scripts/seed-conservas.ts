// Seeds a handful of "conserva" / latería products (B2C + B2B variants).
// Run with: npm run seed:conservas
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ConservaSeed {
  title: string;
  slug: string;
  description: string;
  weightGrams: number;
  retailCents: number;
  wholesaleCents: number;
  unitsPerCase: number;
}

const CONSERVAS: ConservaSeed[] = [
  {
    title: "Mejillones en Escabeche El Travieso",
    slug: "mejillones-escabeche-el-travieso",
    description:
      "Mejillones gallegos en escabeche canalla, perfectos para acompañar el vermut.",
    weightGrams: 115,
    retailCents: 690,
    wholesaleCents: 420,
    unitsPerCase: 12,
  },
  {
    title: "Berberechos al Natural 40/50",
    slug: "berberechos-natural-40-50",
    description:
      "Berberechos de las rías seleccionados, calibre 40/50. El maridaje definitivo.",
    weightGrams: 110,
    retailCents: 1290,
    wholesaleCents: 850,
    unitsPerCase: 12,
  },
  {
    title: "Anchoas del Cantábrico en Aceite",
    slug: "anchoas-cantabrico-aceite",
    description:
      "Filetes de anchoa curados en sal y aceite de oliva virgen extra.",
    weightGrams: 50,
    retailCents: 990,
    wholesaleCents: 640,
    unitsPerCase: 24,
  },
  {
    title: "Aceitunas Gordal Rellenas de Vermut",
    slug: "aceitunas-gordal-rellenas-vermut",
    description: "Aceitunas gordales rellenas con reducción de vermut rojo.",
    weightGrams: 150,
    retailCents: 540,
    wholesaleCents: 320,
    unitsPerCase: 12,
  },
];

async function main() {
  for (const conserva of CONSERVAS) {
    const product = await prisma.product.upsert({
      where: { slug: conserva.slug },
      update: {
        title: conserva.title,
        description: conserva.description,
        type: "CONSERVA",
        category: "CONSERVA_LATERIO",
        channel: "BOTH",
        weightGrams: conserva.weightGrams,
        isActive: true,
      },
      create: {
        title: conserva.title,
        slug: conserva.slug,
        description: conserva.description,
        type: "CONSERVA",
        category: "CONSERVA_LATERIO",
        channel: "BOTH",
        weightGrams: conserva.weightGrams,
        isActive: true,
      },
    });

    // B2C single unit variant.
    const unitSku = `CONS-${conserva.slug.toUpperCase().slice(0, 12)}-UNIT`;
    await prisma.productVariant.upsert({
      where: { sku: unitSku },
      update: {
        priceCents: conserva.retailCents,
        wholesaleCents: conserva.wholesaleCents,
        isActive: true,
      },
      create: {
        productId: product.id,
        sku: unitSku,
        format: "UNIT",
        channel: "B2C",
        priceCents: conserva.retailCents,
        wholesaleCents: conserva.wholesaleCents,
        minOrderQty: 1,
        stock: 100,
      },
    });

    // B2B case variant.
    const caseSku = `CONS-${conserva.slug.toUpperCase().slice(0, 12)}-CASE`;
    await prisma.productVariant.upsert({
      where: { sku: caseSku },
      update: {
        priceCents: conserva.retailCents * conserva.unitsPerCase,
        wholesaleCents: conserva.wholesaleCents * conserva.unitsPerCase,
        unitsPerCase: conserva.unitsPerCase,
        isActive: true,
      },
      create: {
        productId: product.id,
        sku: caseSku,
        format: conserva.unitsPerCase >= 12 ? "CASE_12" : "CASE_6",
        channel: "B2B",
        priceCents: conserva.retailCents * conserva.unitsPerCase,
        wholesaleCents: conserva.wholesaleCents * conserva.unitsPerCase,
        unitsPerCase: conserva.unitsPerCase,
        minOrderQty: 1,
        stock: 50,
      },
    });

    console.log(`Conserva sembrada: ${conserva.title}`);
  }
}

main()
  .catch((error) => {
    console.error("Error sembrando conservas:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
