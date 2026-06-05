import type { Metadata } from "next";
import MapaPageClient from "@/components/map/MapaPageClient";
import { listEditorialVenuesForIndex } from "@/lib/venues/catalog";

export const metadata: Metadata = {
  title: "Guía de locales | Vermut El Travieso",
  description:
    "Coctelerías, bares y restaurantes de la red El Travieso y destacados World's 50 Best. Mapa interactivo y fichas con historia y reservas.",
};

export const revalidate = 3600;

export default async function MapaPage() {
  const editorialIndex = await listEditorialVenuesForIndex(50);
  return <MapaPageClient editorialIndex={editorialIndex} />;
}
