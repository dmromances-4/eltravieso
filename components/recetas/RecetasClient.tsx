'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import CocktailCard from '@/components/CocktailCard'
import RecipeSearchBar, { normalizeSearchQuery } from '@/components/recipes/RecipeSearchBar'
import type { CatalogRecipe } from '@/lib/recipes/catalog'
import { cn } from '@/lib/utils'

const LETTERS = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')]

function firstLetter(title: string): string {
  const normalized = normalizeSearchQuery(title).trim()
  const char = normalized.charAt(0)
  if (char >= 'a' && char <= 'z') {
    return char.toUpperCase()
  }
  return '#'
}

type RecetasClientProps = {
  recipes: CatalogRecipe[]
  initialQuery?: string
}

export default function RecetasClient({ recipes, initialQuery = '' }: RecetasClientProps) {
  const t = useTranslations('search')
  const [query, setQuery] = useState(initialQuery)
  const [activeLetter, setActiveLetter] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeSearchQuery(query).trim()

    return recipes.filter((recipe) => {
      if (activeLetter && firstLetter(recipe.title) !== activeLetter) {
        return false
      }

      if (normalizedQuery) {
        const haystack = normalizeSearchQuery([recipe.title, ...recipe.ingredients].join(' '))
        if (!haystack.includes(normalizedQuery)) {
          return false
        }
      }

      return true
    })
  }, [recipes, query, activeLetter])

  return (
    <section className="space-y-8">
      <div className="sticky top-24 z-30 space-y-4 rounded-card border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur-md">
        <RecipeSearchBar
          variant="full"
          defaultQuery={initialQuery}
          onQueryChange={setQuery}
          showTypeahead={false}
        />

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveLetter(null)}
            className={cn('search-chip', activeLetter === null && 'search-chip-active')}
          >
            {t('allLetters')}
          </button>
          {LETTERS.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => setActiveLetter(letter)}
              className={cn('search-chip min-w-[2rem] text-center', activeLetter === letter && 'search-chip-active')}
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
        <div className="rounded-card border border-slate-200 bg-white py-16 text-center shadow-sm">
          <p className="text-slate-500">{t('noResults')}</p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setActiveLetter(null)
            }}
            className="mt-4 text-sm font-medium text-electric-blue hover:underline"
          >
            {t('clearFilters')}
          </button>
        </div>
      )}
    </section>
  )
}
