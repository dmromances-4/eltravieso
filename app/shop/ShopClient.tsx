'use client';

import { useState } from 'react';
import AlcoholCard from '@/components/AlcoholCard';
import type { AlcoholRecord } from '@/types/alcohol';

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

const TABS: { id: TabId; label: string }[] = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'VERMUT', label: 'Vermut' },
  { id: 'ALCOHOL', label: 'Alcoholes' },
  { id: 'COCTELERIA', label: 'Coctelería' },
  { id: 'SIROPES', label: 'Siropes' },
  { id: 'SODAS', label: 'Sodas' },
  { id: 'CONSERVAS', label: 'Conservas' },
  { id: 'CRISTALERIA', label: 'Cristalería' },
  { id: 'MATERIAL', label: 'Material' },
  { id: 'ROPA', label: 'Ropa' },
  { id: 'MERCH', label: 'Merch' },
  { id: 'INGREDIENTES', label: 'Ingredientes' },
  { id: 'ENCICLOPEDIA', label: 'Enciclopedia' },
];

// Mapeo pestana -> categoria del enum ProductCategory.
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
  const [activeTab, setActiveTab] = useState<TabId>('TODOS');

  const filteredProducts = products.filter((p) => matchesTab(p, activeTab));

  return (
    <div className="mx-auto max-w-7xl px-6 sm:px-8">
      <div className="mb-16 space-y-4">
        <p className="inline-flex rounded-full border border-electric-yellow/20 bg-electric-yellow/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-electric-yellow">
          Tienda Oficial & Enciclopedia
        </p>
        <h1 className="text-5xl font-display font-bold tracking-tight text-white sm:text-6xl">
          Llévate la <span className="text-electric-yellow italic pr-2">actitud</span> a casa.
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-400">
          Packs de degustación, botellas individuales, siropes, sodas, material de bar y nuestra enciclopedia líquida.
        </p>
      </div>

      <div className="mb-12 flex flex-wrap gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              activeTab === tab.id
                ? 'bg-electric-yellow text-black'
                : 'border border-white/20 text-white hover:border-electric-yellow hover:text-electric-yellow'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'ENCICLOPEDIA' ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {alcohols.map((alcohol) => (
            <AlcoholCard key={alcohol.id} alcohol={alcohol} />
          ))}
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map(product => (
            <article key={product.id} className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#121212] transition-all duration-300 hover:-translate-y-2 hover:border-electric-yellow/30 hover:shadow-[0_0_40px_rgba(255,204,0,0.15)]">
              <div className="relative aspect-square overflow-hidden bg-[#161616] p-8">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-6xl opacity-20">{productEmoji(product)}</span>
                  </div>
                )}
              </div>
              <div className="p-8 flex flex-col justify-between" style={{ minHeight: '240px' }}>
                <div>
                  <h2 className="text-2xl font-display font-bold text-white mb-2">{product.title}</h2>
                  <p className="text-sm text-slate-400 mb-6 line-clamp-3">{product.description}</p>
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-auto">
                  <p className="text-2xl font-bold text-electric-yellow">{(product.priceCents / 100).toFixed(2)} €</p>
                  <button className="rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-electric-yellow">
                    Comprar
                  </button>
                </div>
              </div>
            </article>
          ))}
          {filteredProducts.length === 0 && (
            <p className="text-slate-400 col-span-full py-12 text-center">No hay productos en esta categoría por el momento.</p>
          )}
        </div>
      )}
    </div>
  );
}
