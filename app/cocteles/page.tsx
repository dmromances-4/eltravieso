import type { Metadata } from 'next'
import CocktailCard from '@/components/CocktailCard'
import cocktailsData from '@/data/cocktails.json'

const cocktails = cocktailsData as Array<{
  title: string
  slug: string
  rating: number
  glass: string
  ingredients: string[]
  abv: string
  kcal: number
  cover: string
}>

export const metadata: Metadata = {
  title: 'Cocteles | El Travieso Vermut',
  description: 'Descubre nuestras recetas de cocteles con vermut y fórmulas de autor listas para probar.',
}

export default function CocktailsPage() {
  return (
    <main className="min-h-screen bg-night px-6 py-16 text-white sm:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <section className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-10 shadow-neon">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex rounded-full border border-electric-yellow/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-electric-yellow">Recetario Vermut</span>
            <h1 className="text-4xl font-display tracking-tight text-white sm:text-5xl">Recetas de cocteles con carácter</h1>
            <p className="text-base leading-7 text-slate-300">Explora nuestra colección de combinados elaborados con vermut premium y espíritu irreverente. Cada receta incluye ingredientes, preparación y notas para que montes la barra como un profesional.</p>
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {cocktails.map((cocktail) => (
            <CocktailCard key={cocktail.slug} {...cocktail} />
          ))}
        </section>
      </div>
    </main>
  )
}
