'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { BrandLinkButton } from '@/components/ui/BrandButton'
import BrandLogo from '@/components/brand/BrandLogo'

type HeroSectionProps = {
  featuredCover?: string
  featuredTitle?: string
  featuredSlug?: string
}

export default function HeroSection({
  featuredCover = '/images/cocktails/negroni-travieso.jpg',
  featuredTitle = 'Negroni Travieso',
  featuredSlug = 'negroni-travieso',
}: HeroSectionProps) {
  const t = useTranslations('home')

  return (
    <section className="relative overflow-hidden bg-white pt-28 pb-20 sm:pt-36 sm:pb-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(249,209,66,0.12),transparent_50%)]" />

      <div className="section-shell relative grid items-center gap-12 md:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="max-w-2xl space-y-8">
          <BrandLogo showWordmark={false} size="sm" />
          <p className="eyebrow">{t('heroEyebrow')}</p>
          <h1 className="text-display leading-[1.05]">{t('heroTitle')}</h1>
          <p className="text-body max-w-xl">{t('heroSubtitle')}</p>
          <div className="flex flex-wrap gap-3">
            <BrandLinkButton href="/recetas" size="lg" className="min-h-[44px]">
              {t('ctaRecipes')}
            </BrandLinkButton>
            <BrandLinkButton href="/shop" variant="secondary" size="lg" className="min-h-[44px]">
              {t('ctaShop')}
            </BrandLinkButton>
          </div>
          <nav
            aria-label="Herramientas pro"
            className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm font-medium"
          >
            <Link
              href="/pro/tech-generator"
              className="rounded-md px-2 py-2 text-electric-blue transition-colors hover:text-electric-yellow"
            >
              Barra IA
            </Link>
            <span className="text-slate-600" aria-hidden>
              ·
            </span>
            <Link
              href="/bar-online"
              className="rounded-md px-2 py-2 text-electric-blue transition-colors hover:text-electric-yellow"
            >
              Bar Online
            </Link>
            <span className="text-slate-600" aria-hidden>
              ·
            </span>
            <Link
              href="/mapa"
              className="rounded-md px-2 py-2 text-electric-blue transition-colors hover:text-electric-yellow"
            >
              Mapa
            </Link>
          </nav>
        </div>

        <Link
          href={`/recetas/${featuredSlug}`}
          className="group relative block overflow-hidden rounded-card border border-slate-200 bg-white shadow-subtle"
        >
          <div className="relative aspect-[4/5] sm:aspect-[3/4]">
            <Image
              src={featuredCover}
              alt={featuredTitle}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
              priority
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/75 to-transparent p-6">
            <p className="text-xs font-medium text-electric-yellow">{t('featured')}</p>
            <p className="mt-1 font-display text-xl font-semibold text-white">{featuredTitle}</p>
          </div>
        </Link>
      </div>
    </section>
  )
}
