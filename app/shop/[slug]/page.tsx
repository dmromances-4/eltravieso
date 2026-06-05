import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import AddToCartButton from '@/components/shop/AddToCartButton'

export const dynamic = 'force-dynamic'

type ProductPageProps = {
  params: { slug: string }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } })
  if (!product) {
    return { title: 'Producto no encontrado | Vermut El Travieso' }
  }
  return {
    title: `${product.title} | Vermut El Travieso`,
    description: product.description ?? 'Producto oficial de Vermut El Travieso.',
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { variants: true },
  })

  if (!product) {
    notFound()
  }

  const activeVariant = product.variants.find((v) => v.isActive) || product.variants[0]
  const priceCents = activeVariant?.priceCents ?? 0

  const gallery = [product.imageUrl, ...(product.galleryUrls ?? [])].filter(
    (src): src is string => Boolean(src),
  )
  const mainImage = gallery[0] ?? null

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 text-white">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <Link
          href="/shop"
          className="group mb-12 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-electric-yellow"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span> Volver a la tienda
        </Link>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#161616] p-10">
              {mainImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mainImage} alt={product.title} className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-7xl opacity-20">🥃</span>
                </div>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {gallery.slice(0, 8).map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#161616] p-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`${product.title} ${index + 1}`} className="h-full w-full object-contain" loading="lazy" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <p className="inline-flex rounded-full border border-electric-yellow/20 bg-electric-yellow/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-electric-yellow">
                {product.category}
              </p>
              <h1 className="text-4xl font-display font-bold tracking-tight text-white sm:text-5xl">
                {product.title}
              </h1>
              <p className="text-3xl font-bold text-electric-yellow">{(priceCents / 100).toFixed(2)} €</p>
            </div>

            {product.description && (
              <p className="text-base leading-7 text-slate-300">{product.description}</p>
            )}

            {(product.abv != null || product.volumeMl != null) && (
              <div className="flex flex-wrap gap-3">
                {product.abv != null && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300">
                    {(product.abv / 100).toFixed(2)}% ABV
                  </span>
                )}
                {product.volumeMl != null && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300">
                    {product.volumeMl} ml
                  </span>
                )}
              </div>
            )}

            {activeVariant ? (
              <div className="rounded-[2rem] border border-white/10 bg-[#121212] p-8 shadow-neon">
                <AddToCartButton
                  item={{
                    id: activeVariant.id,
                    name: product.title,
                    description: product.description ?? activeVariant.format,
                    amount: priceCents,
                    image: product.imageUrl ?? undefined,
                  }}
                />
              </div>
            ) : (
              <p className="rounded-[2rem] border border-white/10 bg-[#121212] p-8 text-sm text-slate-400 shadow-neon">
                Este producto no está disponible para la venta en este momento.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
