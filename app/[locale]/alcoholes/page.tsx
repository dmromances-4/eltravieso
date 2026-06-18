import { Metadata } from 'next';
import { getAllAlcohols } from '@/lib/alcohol/catalog';
import AlcoholesClient from '@/components/alcoholes/AlcoholesClient';
import type { AppLocale } from '@/i18n/routing';

export const metadata: Metadata = {
  title: 'Enciclopedia del Alcohol | Vermut El Travieso',
  description: 'Fichas técnicas, origen y notas de cata de los destilados más importantes.',
};

type Props = { params: { locale: AppLocale } };

export default function AlcoholesPage({ params }: Props) {
  const alcohols = getAllAlcohols(params.locale);

  return (
    <main className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 text-slate-900">
      <AlcoholesClient alcohols={alcohols} />
    </main>
  );
}
