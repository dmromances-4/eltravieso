import HeroSection from '@/components/HeroSection'
import CocktailCard from '@/components/CocktailCard'
import AlcoholCard from '@/components/AlcoholCard'
import { BrandLinkButton } from '@/components/ui/BrandButton'
import { Section } from '@/components/ui/Section'
import { SurfaceCard } from '@/components/ui/SurfaceCard'
import data from '@/data/cocktails.json'
import alcoholData from '@/data/alcohol-encyclopedia.json'
import type { CocktailRecord } from '@/types/cocktail'
import type { AlcoholRecord } from '@/types/alcohol'
import BookCard from '@/components/biblioteca/BookCard'
import { getAllBooks } from '@/lib/books/catalog'

export default function Home() {
  const cocktails = data as CocktailRecord[]
  const alcohols = alcoholData as AlcoholRecord[]
  const featured = cocktails[0]
  const featuredCocktails = cocktails.slice(0, 3)
  const featuredAlcohols = alcohols.slice(0, 3)
  const featuredBooks = getAllBooks().slice(0, 3)

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <HeroSection
        featuredCover={featured?.cover}
        featuredTitle={featured?.title ?? 'Receta destacada'}
        featuredSlug={featured?.slug ?? 'sweet-martini'}
      />

      <Section alt>
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="eyebrow">Portal</p>
            <h2 className="text-title">Todo El Travieso, en un vistazo</h2>
            <p className="max-w-xl text-body">Recetas, biblioteca, tienda, mapa y herramientas pro — sin perderte en el menú.</p>
          </div>
          <BrandLinkButton href="/cuenta" variant="secondary" className="shrink-0">
            Mi cuenta
          </BrandLinkButton>
        </div>

        <div className="space-y-10">
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Explorar</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SurfaceCard href="/recetas">
                <h3 className="text-lg font-semibold text-white">Recetas</h3>
                <p className="mt-2 text-sm leading-7 text-slate-400">Catálogo editorial con fichas completas.</p>
              </SurfaceCard>
              <SurfaceCard href="/alcoholes">
                <h3 className="text-lg font-semibold text-white">Alcoholes</h3>
                <p className="mt-2 text-sm leading-7 text-slate-400">Origen, notas y contexto de cada destilado.</p>
              </SurfaceCard>
              <SurfaceCard href="/biblioteca">
                <h3 className="text-lg font-semibold text-white">Biblioteca</h3>
                <p className="mt-2 text-sm leading-7 text-slate-400">Libros de referencia para la barra y la coctelería.</p>
              </SurfaceCard>
              <SurfaceCard href="/shop">
                <h3 className="text-lg font-semibold text-white">Tienda</h3>
                <p className="mt-2 text-sm leading-7 text-slate-400">Vermut, packs y regalos con actitud.</p>
              </SurfaceCard>
              <SurfaceCard href="/blog">
                <h3 className="text-lg font-semibold text-white">Blog</h3>
                <p className="mt-2 text-sm leading-7 text-slate-400">Tendencias y notas para profesionales.</p>
              </SurfaceCard>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Herramientas pro</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SurfaceCard href="/pro/tech-generator" className="hover:border-electric-yellow/40">
                <h3 className="text-lg font-semibold text-white">Barra IA</h3>
                <p className="mt-2 text-sm text-slate-400">Genera recetas y fichas técnicas con IA.</p>
              </SurfaceCard>
              <SurfaceCard href="/bar-online" className="hover:border-electric-red/30">
                <h3 className="text-lg font-semibold text-white">Bar Online</h3>
                <p className="mt-2 text-sm text-slate-400">Salas en directo con chat y videollamada.</p>
              </SurfaceCard>
              <SurfaceCard href="/mapa">
                <h3 className="text-lg font-semibold text-white">Mapa</h3>
                <p className="mt-2 text-sm text-slate-400">Locales y coctelería de referencia.</p>
              </SurfaceCard>
              <SurfaceCard href="/pantalla">
                <h3 className="text-lg font-semibold text-white">Pantalla</h3>
                <p className="mt-2 text-sm text-slate-400">Series, podcasts y directo.</p>
              </SurfaceCard>
            </div>
          </div>
        </div>
      </Section>

      <Section id="catalogo">
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="eyebrow">Catálogo</p>
            <h2 className="text-title">Recetas con carácter</h2>
          </div>
          <BrandLinkButton href="/recetas" variant="secondary" className="shrink-0">
            Ver todas
          </BrandLinkButton>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCocktails.map((cocktail) => (
            <CocktailCard
              key={cocktail.slug}
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
      </Section>

      <Section alt>
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="eyebrow">Biblioteca</p>
            <h2 className="text-title">Lecturas esenciales</h2>
          </div>
          <BrandLinkButton href="/biblioteca" variant="secondary" className="shrink-0">
            Ver biblioteca
          </BrandLinkButton>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </Section>

      <Section>
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="eyebrow">Enciclopedia</p>
            <h2 className="text-title">Conoce lo que bebes</h2>
          </div>
          <BrandLinkButton href="/alcoholes" variant="secondary" className="shrink-0 text-electric-blue">
            Explorar
          </BrandLinkButton>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredAlcohols.map((alcohol) => (
            <AlcoholCard key={alcohol.id} alcohol={alcohol} />
          ))}
        </div>
      </Section>

      <Section alt>
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h2 className="text-title">Pasa a la acción</h2>
          <p className="text-body">Vermut premium y packs de degustación en la tienda oficial.</p>
          <BrandLinkButton href="/shop" size="lg">
            Entrar a la tienda
          </BrandLinkButton>
        </div>
      </Section>
    </main>
  )
}
