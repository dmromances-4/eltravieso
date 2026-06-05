import { Metadata } from 'next';
import alcoholData from '@/data/alcohol-encyclopedia.json';
import type { AlcoholRecord } from '@/types/alcohol';
import AlcoholesClient from '@/components/alcoholes/AlcoholesClient';

export const metadata: Metadata = {
  title: 'Enciclopedia del Alcohol | Vermut El Travieso',
  description: 'Fichas técnicas, origen y notas de cata de los destilados más importantes.',
};

export default function AlcoholesPage() {
  const alcohols = alcoholData as AlcoholRecord[];

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 text-white">
      <AlcoholesClient alcohols={alcohols} />
    </main>
  );
}
