import AgeGateModal from '@/components/AgeGateModal'
import HeroSection from '@/components/HeroSection'
import CocktailCard from '@/components/CocktailCard'
import AlcoholCard from '@/components/AlcoholCard'
import data from '@/data/cocktails.json'
import alcoholData from '@/data/alcohol-encyclopedia.json'
import type { CocktailRecord } from '@/types/cocktail'
import type { AlcoholRecord } from '@/types/alcohol'
import Link from 'next/link'

export default function Home() {
  const cocktails = data.cocktails as CocktailRecord[]
  const alcohols = alcoholData.alcohols as AlcoholRecord[]
  
  // Show only 3 items on home page
  const featuredCocktails = cocktails.slice(0, 3)
  const featuredAlcohols = alcohols.slice(0, 3)

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <HeroSection />

      {/* Cocktails Section */}
      <section id="catalogo" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="space-y-4">
              <h2 className="text-4xl font-display tracking-tight text-white sm:text-5xl">Catálogo Canalla</h2>
              <p className="max-w-xl text-slate-400">Las recetas maestras que no encontrarás en ningún bar aburrido.</p>
            </div>
            <Link href="/cocteles" className="inline-flex items-center gap-2 rounded-full border border-electric-yellow bg-electric-yellow/5 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-electric-yellow transition-all hover:bg-electric-yellow/10 shrink-0">
              Ver todos →
            </Link>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCocktails.map((cocktail) => (
              <CocktailCard
                key={cocktail.id}
                title={cocktail.identity.name}
                slug={cocktail.id}
                rating={cocktail.performance.complexity / 2}
                glass={cocktail.presentation.glassware}
                ingredients={cocktail.recipe.ingredients.map(i => i.name)}
                abv={cocktail.performance.estimated_abv}
                kcal={cocktail.performance.kcal}
                cover="/cocktail-placeholder.svg"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Encyclopedia Section */}
      <section className="border-t border-white/5 bg-[#0f0f0f] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="space-y-4">
              <h2 className="text-4xl font-display tracking-tight text-white sm:text-5xl">Enciclopedia del Alcohol</h2>
              <p className="max-w-xl text-slate-400">Conoce lo que bebes. Fichas técnicas, procesos y origen de los destilados más importantes.</p>
            </div>
            <Link href="/alcoholes" className="inline-flex items-center gap-2 rounded-full border border-electric-blue bg-electric-blue/5 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-electric-blue transition-all hover:bg-electric-blue/10 shrink-0">
              Explorar →
            </Link>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredAlcohols.map((alcohol) => (
              <AlcoholCard key={alcohol.id} alcohol={alcohol} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="relative overflow-hidden py-32 sm:py-40 border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,204,0,0.1),_transparent_40%)]" />
        <div className="relative mx-auto max-w-3xl px-6 sm:px-8 text-center space-y-8">
          <h2 className="text-4xl font-display font-bold tracking-tight text-white sm:text-6xl">Pasa a la acción.</h2>
          <p className="text-lg leading-8 text-slate-400">
            Descubre nuestra selección de vermuts premium y packs de degustación en la tienda oficial.
          </p>
          <div className="pt-4">
            <Link href="/shop" className="inline-flex items-center justify-center rounded-full bg-electric-yellow px-10 py-5 text-sm font-bold uppercase tracking-[0.2em] text-black transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,204,0,0.3)]">
              Entrar a la Tienda
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
