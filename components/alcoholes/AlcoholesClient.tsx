'use client';

import { useMemo, useState } from 'react';
import AlcoholCard from '@/components/AlcoholCard';
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

type AlcoholesClientProps = {
  alcohols: AlcoholRecord[];
};

export default function AlcoholesClient({ alcohols }: AlcoholesClientProps) {
  const [query, setQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const unique = new Set(alcohols.map((a) => a.category).filter(Boolean));
    return Array.from(unique).sort();
  }, [alcohols]);

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeText(query).trim();

    return alcohols.filter((alcohol) => {
      if (activeCategory && alcohol.category !== activeCategory) return false;
      if (activeLetter && firstLetter(alcohol.identity.name_exact) !== activeLetter) return false;

      if (normalizedQuery) {
        const haystack = normalizeText(
          [
            alcohol.identity.name_exact,
            alcohol.identity.brand,
            alcohol.identity.producer,
            alcohol.category,
            alcohol.subcategory,
            alcohol.identity.country,
            alcohol.identity.region,
          ].join(' '),
        );
        if (!haystack.includes(normalizedQuery)) return false;
      }

      return true;
    });
  }, [alcohols, query, activeLetter, activeCategory]);

  return (
    <div className="mx-auto max-w-7xl px-6 sm:px-8">
      <div className="mb-16 space-y-4">
        <p className="inline-flex rounded-full border border-electric-blue/20 bg-electric-blue/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-electric-blue">
          Enciclopedia Líquida
        </p>
        <h1 className="text-5xl font-display font-bold tracking-tight text-white sm:text-6xl">
          El mundo del <span className="text-electric-blue italic pr-2">alcohol</span>
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-400">
          Fichas técnicas, procesos de destilación, notas de cata y contexto histórico de los destilados más importantes.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
            activeCategory === null
              ? 'bg-electric-blue text-black'
              : 'border border-white/20 text-white hover:border-electric-blue'
          }`}
        >
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              activeCategory === category
                ? 'bg-electric-blue text-black'
                : 'border border-white/20 text-white hover:border-electric-blue'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mb-12 space-y-4">
        <div className="relative max-w-xl">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busca por nombre, marca o país…"
            aria-label="Buscar en la enciclopedia"
            className="w-full rounded-full border border-white/10 bg-[#0f0f0f] py-3.5 pl-12 pr-4 text-white outline-none transition-all focus:border-electric-blue focus:ring-1 focus:ring-electric-blue placeholder:text-slate-600"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveLetter(null)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
              activeLetter === null
                ? 'bg-electric-blue text-black'
                : 'border border-white/20 text-slate-300 hover:border-electric-blue'
            }`}
          >
            Todas
          </button>
          {LETTERS.map((letter) => (
            <button
              key={letter}
              onClick={() => setActiveLetter(letter)}
              aria-pressed={activeLetter === letter}
              className={`h-8 w-8 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                activeLetter === letter
                  ? 'bg-electric-blue text-black'
                  : 'border border-white/20 text-slate-300 hover:border-electric-blue'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((alcohol) => (
          <AlcoholCard key={alcohol.id} alcohol={alcohol} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-slate-400">No hay resultados para tu búsqueda.</p>
      )}
    </div>
  );
}
