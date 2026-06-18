import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { notFound } from 'next/navigation'
import ProductFicha from '@/components/shop/ProductFicha'
import { resolveProductFicha } from '@/lib/products/resolve-product-ficha'
import type { AppLocale } from '@/i18n/routing'

export const dynamic = 'force-dynamic'

type ProductPageProps = {
  params: { slug: string; locale: AppLocale }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const ficha = await resolveProductFicha(params.slug, params.locale)
  if (!ficha) {
    return { title: 'Producto no encontrado | Vermut El Travieso' }
  }
  return {
    title: `${ficha.title} | Vermut El Travieso`,
    description: ficha.description ?? 'Producto oficial de Vermut El Travieso.',
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const ficha = await resolveProductFicha(params.slug, params.locale)

  if (!ficha) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <Link
          href="/shop"
          className="group mb-12 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-electric-yellow"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span> Volver a la tienda
        </Link>

        <ProductFicha ficha={ficha} />
      </div>
    </main>
  )
}
