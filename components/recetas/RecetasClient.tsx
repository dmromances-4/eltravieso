'use client'

import { useMemo, useState } from 'react'
import CocktailCard from '@/components/CocktailCard'
import type { CatalogRecipe } from '@/lib/recipes/catalog'
import { cn } from '@/lib/utils'

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

  const chipClass = (active: boolean) =>
    cn(
      'rounded-pill px-3 py-1 text-xs font-medium transition-colors',
      active
        ? 'bg-electric-yellow text-black'
        : 'border border-white/15 text-slate-300 hover:border-electric-blue/40 hover:text-white',
    )

  return (
    <section className="space-y-8">
      <div className="sticky top-24 z-30 space-y-4 rounded-card border border-white/10 bg-[#111111]/95 p-5 backdrop-blur-md">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busca por nombre o ingrediente…"
            className="w-full rounded-pill border border-white/10 bg-[#0f0f0f] py-3 pl-11 pr-4 text-white outline-none transition-colors focus:border-electric-blue focus:ring-1 focus:ring-electric-blue placeholder:text-slate-600"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setActiveLetter(null)} className={chipClass(activeLetter === null)}>
            Todas
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

      {filtered.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
        <div className="rounded-card border border-white/10 bg-[#111111]/90 py-16 text-center">
          <p className="text-slate-400">
            No encontramos recetas que coincidan con tu búsqueda.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setActiveLetter(null)
            }}
            className="mt-4 text-sm font-medium text-electric-blue hover:text-white"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </section>
  )
}
