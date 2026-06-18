import HeroSection from '@/components/HeroSection'
import CocktailCard from '@/components/CocktailCard'
import AlcoholCard from '@/components/AlcoholCard'
import { BrandLinkButton } from '@/components/ui/BrandButton'
import { Section } from '@/components/ui/Section'
import { SurfaceCard } from '@/components/ui/SurfaceCard'
import BookCard from '@/components/biblioteca/BookCard'
import { getAllBooks } from '@/lib/books/catalog'
import { getAllAlcohols } from '@/lib/alcohol/catalog'
import { getCatalogRecipes } from '@/lib/recipes/catalog'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { AppLocale } from '@/i18n/routing'

type Props = { params: { locale: AppLocale } }

export default async function Home({ params }: Props) {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale })
  const cocktails = await getCatalogRecipes(params.locale)
  const alcohols = getAllAlcohols(params.locale)
  const featured = cocktails[0]
  const featuredCocktails = cocktails.slice(0, 3)
  const featuredAlcohols = alcohols.slice(0, 3)
  const featuredBooks = getAllBooks(params.locale).slice(0, 3)

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <HeroSection
        featuredCover={featured?.cover}
        featuredTitle={featured?.title ?? t('recipes.title')}
        featuredSlug={featured?.slug ?? 'sweet-martini'}
      />

      <Section alt>
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="eyebrow">Portal</p>
            <h2 className="text-title">{t('home.heroTitle')}</h2>
            <p className="max-w-xl text-body">{t('home.heroSubtitle')}</p>
          </div>
          <BrandLinkButton href="/cuenta" variant="secondary" className="shrink-0 min-h-[44px]">
            {t('nav.account')}
          </BrandLinkButton>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SurfaceCard href="/recetas">
            <h3 className="text-lg font-semibold text-slate-900">{t('nav.recipes')}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500">{t('recipes.title')}</p>
          </SurfaceCard>
          <SurfaceCard href="/alcoholes">
            <h3 className="text-lg font-semibold text-slate-900">{t('nav.spirits')}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500">{t('nav.spirits')}</p>
          </SurfaceCard>
          <SurfaceCard href="/biblioteca">
            <h3 className="text-lg font-semibold text-slate-900">{t('nav.library')}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500">{t('nav.library')}</p>
          </SurfaceCard>
          <SurfaceCard href="/shop">
            <h3 className="text-lg font-semibold text-slate-900">{t('nav.shop')}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500">{t('shop.title')}</p>
          </SurfaceCard>
          <SurfaceCard href="/blog">
            <h3 className="text-lg font-semibold text-slate-900">{t('nav.blog')}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500">{t('nav.blog')}</p>
          </SurfaceCard>
          <SurfaceCard href="/mapa">
            <h3 className="text-lg font-semibold text-slate-900">{t('nav.map')}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500">{t('nav.map')}</p>
          </SurfaceCard>
        </div>
      </Section>

      <Section>
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">{t('nav.recipes')}</p>
            <h2 className="text-title">{t('recipes.title')}</h2>
          </div>
          <BrandLinkButton href="/recetas" variant="secondary">{t('common.viewAll')}</BrandLinkButton>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCocktails.map((cocktail) => (
            <CocktailCard key={cocktail.slug} {...cocktail} />
          ))}
        </div>
      </Section>

      <Section alt>
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">{t('nav.spirits')}</p>
            <h2 className="text-title">{t('nav.spirits')}</h2>
          </div>
          <BrandLinkButton href="/alcoholes" variant="secondary">{t('common.viewAll')}</BrandLinkButton>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredAlcohols.map((alcohol) => (
            <AlcoholCard key={alcohol.id} alcohol={alcohol} />
          ))}
        </div>
      </Section>

      <Section>
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">{t('nav.library')}</p>
            <h2 className="text-title">{t('nav.library')}</h2>
          </div>
          <BrandLinkButton href="/biblioteca" variant="secondary">{t('common.viewAll')}</BrandLinkButton>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredBooks.map((book) => (
            <BookCard key={book.slug} book={book} />
          ))}
        </div>
      </Section>
    </main>
  )
}
