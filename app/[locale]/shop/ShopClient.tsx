'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AlcoholCard from '@/components/AlcoholCard';
import { EditorialCard } from '@/components/ui/EditorialCard';
import { MetaChip } from '@/components/ui/MetaChip';
import { PageHero } from '@/components/ui/PageHero';
import { cn } from '@/lib/utils';
import type { AlcoholRecord } from '@/types/alcohol';

const LETTERS = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function firstLetter(title: string): string {
  const char = normalizeText(title).trim().charAt(0);
  if (char >= 'a' && char <= 'z') {
    return char.toUpperCase();
  }
  return '#';
}

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  category: string;
  type: string;
};

type ShopClientProps = {
  products: Product[];
  alcohols: AlcoholRecord[];
};

type TabId =
  | 'TODOS'
  | 'VERMUT'
  | 'ALCOHOL'
  | 'COCTELERIA'
  | 'SIROPES'
  | 'SODAS'
  | 'CONSERVAS'
  | 'CRISTALERIA'
  | 'MATERIAL'
  | 'ROPA'
  | 'MERCH'
  | 'INGREDIENTES'
  | 'ENCICLOPEDIA';

const TAB_LABEL_KEYS: Record<TabId, string> = {
  TODOS: 'tabAll',
  VERMUT: 'tabVermouth',
  ALCOHOL: 'tabAlcohol',
  COCTELERIA: 'tabCocteleria',
  SIROPES: 'tabSiropes',
  SODAS: 'tabSodas',
  CONSERVAS: 'tabConservas',
  CRISTALERIA: 'tabCristaleria',
  MATERIAL: 'tabMaterial',
  ROPA: 'tabRopa',
  MERCH: 'tabMerch',
  INGREDIENTES: 'tabIngredientes',
  ENCICLOPEDIA: 'tabEnciclopedia',
};

const TABS: { id: TabId }[] = [
  { id: 'TODOS' },
  { id: 'VERMUT' },
  { id: 'ALCOHOL' },
  { id: 'COCTELERIA' },
  { id: 'SIROPES' },
  { id: 'SODAS' },
  { id: 'CONSERVAS' },
  { id: 'CRISTALERIA' },
  { id: 'MATERIAL' },
  { id: 'ROPA' },
  { id: 'MERCH' },
  { id: 'INGREDIENTES' },
  { id: 'ENCICLOPEDIA' },
];

const TAB_CATEGORY: Partial<Record<TabId, string>> = {
  VERMUT: 'VERMUT',
  ALCOHOL: 'ALCOHOL',
  COCTELERIA: 'COCTELERIA',
  SIROPES: 'SIROPE',
  SODAS: 'SODA',
  CONSERVAS: 'CONSERVA_LATERIO',
  CRISTALERIA: 'CRISTALERIA',
  MATERIAL: 'MATERIAL',
  ROPA: 'ROPA',
  MERCH: 'MERCH',
  INGREDIENTES: 'INGREDIENTE',
};

function matchesTab(product: Product, tab: TabId): boolean {
  if (tab === 'TODOS') return true;
  if (tab === 'CONSERVAS') {
    return product.category === 'CONSERVA_LATERIO' || product.type === 'CONSERVA';
  }
  if (tab === 'MERCH') {
    return product.category === 'MERCH' || product.type === 'MERCH';
  }
  const category = TAB_CATEGORY[tab];
  return category ? product.category === category : false;
}

function productEmoji(product: Product): string {
  switch (product.category) {
    case 'CONSERVA_LATERIO':
      return '🥫';
    case 'MERCH':
    case 'ROPA':
      return '👕';
    case 'CRISTALERIA':
      return '🥂';
    case 'MATERIAL':
      return '🧰';
    case 'SIROPE':
      return '🍯';
    case 'SODA':
      return '🥤';
    case 'INGREDIENTE':
      return '🧂';
    default:
      return '🥃';
  }
}

export default function ShopClient({ products, alcohols }: ShopClientProps) {
  const t = useTranslations('shop');
  const [activeTab, setActiveTab] = useState<TabId>('TODOS');
  const [query, setQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeText(query).trim();

    return products.filter((p) => {
      if (!matchesTab(p, activeTab)) return false;

      if (activeLetter && firstLetter(p.title) !== activeLetter) {
        return false;
      }

      if (normalizedQuery) {
        const haystack = normalizeText(`${p.title} ${p.description ?? ''}`);
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }

      return true;
    });
  }, [products, activeTab, query, activeLetter]);

  const tabClass = (active: boolean) =>
    cn(
      'rounded-pill px-4 py-2 text-xs font-medium transition-colors',
      active
        ? 'bg-electric-yellow text-slate-900'
        : 'border border-slate-200 text-slate-600 hover:border-electric-blue/40 hover:text-slate-900',
    );

  const chipClass = (active: boolean) =>
    cn('search-chip', active && 'search-chip-active');

  return (
    <div className="section-shell space-y-12">
      <PageHero
        eyebrow={t('heroEyebrow')}
        title={t('heroTitle')}
        lead={t('heroLead')}
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={tabClass(activeTab === tab.id)}>
            {t(TAB_LABEL_KEYS[tab.id])}
          </button>
        ))}
      </div>

      {activeTab !== 'ENCICLOPEDIA' ? (
        <div className="space-y-4 rounded-card border border-slate-200 bg-white p-5 shadow-sm">
          <div className="relative max-w-xl">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('searchPlaceholder')}
              className="search-input"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setActiveLetter(null)} className={chipClass(activeLetter === null)}>
              {t('allLetters')}
            </button>
            {LETTERS.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => setActiveLetter(letter)}
                className={cn(chipClass(activeLetter === letter), 'min-w-[2rem] text-center')}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === 'ENCICLOPEDIA' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {alcohols.map((alcohol) => (
            <AlcoholCard key={alcohol.id} alcohol={alcohol} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <EditorialCard
              key={product.id}
              href={`/shop/${product.slug}`}
              title={product.title}
              subtitle={product.category.replace(/_/g, ' ')}
              aspect="square"
              imageSrc={product.imageUrl}
              imageAlt={product.title}
              meta={<MetaChip tone="yellow">{(product.priceCents / 100).toFixed(2)} €</MetaChip>}
              footer={
                <div className="space-y-3">
                  {product.description ? (
                    <p className="line-clamp-2 text-sm text-slate-500">{product.description}</p>
                  ) : (
                    <p className="text-4xl opacity-20">{productEmoji(product)}</p>
                  )}
                  <Link href={`/shop/${product.slug}`} className="text-sm font-medium text-electric-blue hover:underline">
                    {t('viewProduct')} →
                  </Link>
                </div>
              }
            />
          ))}
          {filteredProducts.length === 0 ? (
            <p className="col-span-full py-12 text-center text-slate-500">{t('empty')}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
