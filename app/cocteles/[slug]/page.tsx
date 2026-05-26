import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'

interface Cocktail {
  title: string
  slug: string
  rating: number
  glass: string
  ingredients: string[]
  method: string
  abv: string
  kcal: number
  cover: string
}

import cocktailsData from '@/data/cocktails.json'

const cocktails = cocktailsData as Cocktail[]

export function generateStaticParams() {
  return cocktails.map((cocktail) => ({ slug: cocktail.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const cocktail = cocktails.find((item) => item.slug === params.slug)
  if (!cocktail) return { title: 'Cocktail no encontrado' }
  return {
    title: cocktail.title,
    description: `Ficha de receta premium para ${cocktail.title}`
  }
}

const normalizeIngredients = (value: string[]) =>
  value
    .flatMap((item) => item.split(/\r?\n|;|\s*-\s*/))
    .map((item) => item.trim())
    .filter(Boolean)

export default function CocktailPage({ params }: { params: { slug: string } }) {
  const cocktail = cocktails.find((item) => item.slug === params.slug)
  if (!cocktail) {
    notFound()
  }

  const ingredients = normalizeIngredients(cocktail.ingredients)

  return (
    <main className="min-h-screen bg-night px-6 py-12 text-white sm:px-8">
      <section className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.25fr_0.85fr] lg:items-start">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-electric-yellow/20 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-electric-yellow">
            Ficha de cóctel
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-display tracking-tight text-white sm:text-6xl">{cocktail.title}</h1>
            <p className="max-w-3xl text-base leading-8 text-slate-300">Un clásico de vermut premium convertido en experiencia visual: ingredientes, método, valoración y energía.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-[#111111]/90 p-6">
              <span className="block text-sm uppercase tracking-[0.35em] text-slate-400">Valoración</span>
              <p className="mt-3 text-4xl font-semibold text-white">{cocktail.rating.toFixed(1)}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#111111]/90 p-6">
              <span className="block text-sm uppercase tracking-[0.35em] text-slate-400">Vaso</span>
              <p className="mt-3 text-xl font-semibold text-white">{cocktail.glass}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#111111]/90 p-6">
              <span className="block text-sm uppercase tracking-[0.35em] text-slate-400">ABV / kcal</span>
              <p className="mt-3 text-xl font-semibold text-white">{cocktail.abv} · {cocktail.kcal} kcal</p>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-electric-yellow/10 bg-[#0f0f0f]/90 p-8 shadow-neon">
            <h2 className="text-2xl font-semibold text-white">Método de preparación</h2>
            <p className="mt-5 whitespace-pre-line leading-8 text-slate-300">{cocktail.method}</p>
          </div>
        </div>

        <aside className="space-y-8">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#111111]/80 shadow-neon">
            <Image
              src={cocktail.cover}
              alt={cocktail.title}
              width={900}
              height={900}
              className="h-auto w-full object-cover"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent p-6">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Imagen de cóctel</p>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-white/10 bg-[#111111]/90 p-8 shadow-neon">
            <h3 className="text-xl font-semibold text-white">Ingredientes</h3>
            <ul className="mt-6 space-y-4 text-slate-300">
              {ingredients.map((ingredient) => (
                <li key={ingredient} className="flex items-start gap-4 rounded-3xl border border-white/5 bg-[#0f0f0f]/90 p-4">
                  <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-electric-yellow/10 text-electric-yellow">•</span>
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </main>
  )
}
