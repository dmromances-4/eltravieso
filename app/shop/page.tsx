import { Metadata } from "next";
import prisma from "@/lib/prisma";
import ShopClient from "./ShopClient";
import alcoholData from '@/data/alcohol-encyclopedia.json';
import type { AlcoholRecord } from '@/types/alcohol';

export const metadata: Metadata = {
  title: 'Tienda y Enciclopedia | Vermut El Travieso',
  description: 'Compra el vermut más canalla online. Botellas, packs, merchandising oficial y nuestra enciclopedia líquida.',
}

export const revalidate = 60; // Revalidate cache every 60 seconds

export default async function ShopPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const alcohols = alcoholData as unknown as AlcoholRecord[];

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 text-white">
      <ShopClient products={products} alcohols={alcohols} />
    </main>
  );
}
