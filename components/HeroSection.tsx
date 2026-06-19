'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BrandLinkButton } from '@/components/ui/BrandButton'

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
  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] pt-28 pb-20 sm:pt-36 sm:pb-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(249,209,66,0.08),transparent_45%)]" />

      <div className="section-shell relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="max-w-2xl space-y-8">
          <p className="eyebrow">Vermut premium canalla</p>
          <h1 className="text-display leading-[1.05]">
            Llenamos el vaso,
            <br />
            no vaciamos el bolsillo.
          </h1>
          <p className="text-body max-w-xl">
            Recetas editoriales, locales con actitud y herramientas pro para tu barra. Oscuro, directo y sin postureo.
          </p>
          <div className="flex flex-wrap gap-3">
            <BrandLinkButton href="/recetas" size="lg">
              Explorar recetas
            </BrandLinkButton>
            <BrandLinkButton href="/shop" variant="secondary" size="lg">
              Ir a la tienda
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
          className="group relative block overflow-hidden rounded-card border border-white/10 bg-charcoal shadow-subtle"
        >
          <div className="relative aspect-[4/5] sm:aspect-[3/4]">
            <Image
              src={featuredCover}
              alt={featuredTitle}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover transition duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="text-sm font-medium text-electric-blue">Receta destacada</p>
              <p className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">{featuredTitle}</p>
              <p className="mt-3 text-sm text-slate-300 transition-colors group-hover:text-electric-yellow">
                Ver ficha →
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}
