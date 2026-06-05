'use client'

import { useMemo, useState } from 'react'
import CocktailCard from '@/components/CocktailCard'
import type { CatalogRecipe } from '@/lib/recipes/catalog'

const LETTERS = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')]

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function firstLetter(title: string): string {
  const normalized = normalize(title).trim()
  const char = normalized.charAt(0)
  if (char >= 'a' && char <= 'z') {
    return char.toUpperCase()
  }
  return '#'
}

type RecetasClientProps = {
  recipes: CatalogRecipe[]
}

export default function RecetasClient({ recipes }: RecetasClientProps) {
  const [query, setQuery] = useState('')
  const [activeLetter, setActiveLetter] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const normalizedQuery = normalize(query).trim()

    return recipes.filter((recipe) => {
      if (activeLetter && firstLetter(recipe.title) !== activeLetter) {
        return false
      }

      if (normalizedQuery) {
        const haystack = normalize(
          [recipe.title, ...recipe.ingredients].join(' '),
        )
        if (!haystack.includes(normalizedQuery)) {
          return false
        }
      }

      return true
    })
  }, [recipes, query, activeLetter])

  return (
    <section className="space-y-8">
      <div className="sticky top-24 z-30 space-y-4 rounded-[2rem] border border-white/10 bg-[#111111]/95 p-5 shadow-neon backdrop-blur-md">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busca por nombre o ingrediente…"
            className="w-full rounded-full border border-white/10 bg-[#0f0f0f] py-3.5 pl-12 pr-4 text-white outline-none transition-all focus:border-electric-yellow focus:ring-1 focus:ring-electric-yellow placeholder:text-slate-600"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveLetter(null)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
              activeLetter === null
                ? 'bg-electric-yellow text-black'
                : 'border border-white/20 text-slate-300 hover:border-electric-yellow'
            }`}
          >
            Todas
          </button>
          {LETTERS.map((letter) => (
            <button
              key={letter}
              onClick={() => setActiveLetter(letter)}
              className={`h-8 w-8 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                activeLetter === letter
                  ? 'bg-electric-yellow text-black'
                  : 'border border-white/20 text-slate-300 hover:border-electric-yellow'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((cocktail) => (
            <CocktailCard
              key={`${cocktail.source}-${cocktail.slug}`}
              title={cocktail.title}
              slug={cocktail.slug}
              rating={cocktail.rating}
              glass={cocktail.glass}
              ingredients={cocktail.ingredients}
              abv={cocktail.abv}
              kcal={cocktail.kcal}
              cover={cocktail.cover}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-white/10 bg-[#111111]/90 py-16 text-center">
          <p className="text-slate-400">
            No encontramos recetas que coincidan con tu búsqueda.
          </p>
          <button
            onClick={() => {
              setQuery('')
              setActiveLetter(null)
            }}
            className="mt-6 inline-flex rounded-full border border-white/20 px-5 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 transition-colors hover:border-electric-yellow"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </section>
  )
}
