import { Metadata } from "next";
import prisma from "@/lib/prisma";
import ShopClient from "./ShopClient";
import alcoholData from '@/data/alcohol-encyclopedia.json';
import type { AlcoholRecord } from '@/types/alcohol';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Tienda y Enciclopedia | Vermut El Travieso',
  description: 'Compra el vermut más canalla online. Botellas, packs, merchandising oficial y nuestra enciclopedia líquida.',
}

export const revalidate = 60; // Revalidate cache every 60 seconds

export default async function ShopPage() {
  const productsRaw = await prisma.product.findMany({
    include: { variants: true },
    orderBy: { createdAt: 'desc' }
  });

  const products = productsRaw.map(p => {
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

  const alcohols = alcoholData as unknown as AlcoholRecord[];

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 text-white">
      <ShopClient products={products} alcohols={alcohols} />
    </main>
  );
}
