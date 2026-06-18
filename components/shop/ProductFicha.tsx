'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import AddToCartButton from '@/components/shop/AddToCartButton';
import type { ProductFichaDTO } from '@/lib/products/resolve-product-ficha';

type Props = {
  ficha: ProductFichaDTO;
};

export default function ProductFicha({ ficha }: Props) {
  const activeVariants = ficha.variants.filter((v) => v.isActive);
  const [selectedVariantId, setSelectedVariantId] = useState(
    activeVariants[0]?.id ?? ficha.variants[0]?.id ?? '',
  );

  const selectedVariant =
    ficha.variants.find((v) => v.id === selectedVariantId) ?? activeVariants[0] ?? ficha.variants[0];

  const gallery = [ficha.imageUrl, ...ficha.galleryUrls].filter((src): src is string => Boolean(src));
  const mainImage = gallery[0] ?? null;
  const priceCents = selectedVariant?.priceCents ?? 0;
  const enc = ficha.encyclopedia;

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="relative aspect-square overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#161616] p-10">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mainImage} alt={ficha.title} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-7xl opacity-20">🥃</span>
            </div>
          )}
        </div>

        {gallery.length > 1 ? (
          <div className="grid grid-cols-4 gap-4">
            {gallery.slice(0, 8).map((src, index) => (
              <div
                key={`${src}-${index}`}
                className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#161616] p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${ficha.title} ${index + 1}`}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="inline-flex rounded-full border border-electric-yellow/20 bg-electric-yellow/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-electric-yellow">
              {ficha.category.replace(/_/g, ' ')}
            </p>
            {ficha.productCode ? (
              <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
                {ficha.productCode}
              </span>
            ) : null}
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-white sm:text-5xl">
            {ficha.title}
          </h1>
          <p className="text-3xl font-bold text-electric-yellow">{(priceCents / 100).toFixed(2)} €</p>
        </div>

        {ficha.description ? (
          <p className="text-base leading-7 text-slate-300">{ficha.description}</p>
        ) : null}

        {activeVariants.length > 1 ? (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Formato</p>
            <div className="flex flex-wrap gap-2">
              {activeVariants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    variant.id === selectedVariant?.id
                      ? 'border-electric-yellow bg-electric-yellow/10 text-electric-yellow'
                      : 'border-white/10 text-slate-300 hover:border-white/30'
                  }`}
                >
                  {variant.format.replace(/_/g, ' ')} — {(variant.priceCents / 100).toFixed(2)} €
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <section className="rounded-[2rem] border border-white/10 bg-[#121212] p-6 shadow-neon">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">Ficha técnica</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {ficha.abv != null ? (
              <div>
                <dt className="text-slate-500">ABV</dt>
                <dd className="text-white">{(ficha.abv / 100).toFixed(2)}%</dd>
              </div>
            ) : null}
            {ficha.volumeMl != null ? (
              <div>
                <dt className="text-slate-500">Volumen</dt>
                <dd className="text-white">{ficha.volumeMl} ml</dd>
              </div>
            ) : null}
            {ficha.weightGrams != null ? (
              <div>
                <dt className="text-slate-500">Peso</dt>
                <dd className="text-white">{ficha.weightGrams} g</dd>
              </div>
            ) : null}
            {selectedVariant?.sku ? (
              <div>
                <dt className="text-slate-500">SKU</dt>
                <dd className="font-mono text-white">{selectedVariant.sku}</dd>
              </div>
            ) : null}
            {selectedVariant?.barcode ? (
              <div>
                <dt className="text-slate-500">EAN</dt>
                <dd className="font-mono text-white">{selectedVariant.barcode}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        {enc ? (
          <section className="space-y-4 rounded-[2rem] border border-white/10 bg-[#121212] p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-electric-blue">Enciclopedia</h2>
            <p className="text-sm text-slate-400">
              {enc.identity.producer} · {enc.identity.region || enc.identity.country}
            </p>
            {enc.sensory.palate ? (
              <p className="text-sm leading-relaxed text-slate-300">{enc.sensory.palate}</p>
            ) : null}
            {enc.didactic.mixology_role ? (
              <p className="text-sm text-slate-400">
                <span className="text-slate-500">En coctelería: </span>
                {enc.didactic.mixology_role}
              </p>
            ) : null}
          </section>
        ) : null}

        {ficha.sourceUrl ? (
          <p className="text-xs text-slate-500">
            Fuente editorial:{' '}
            <a href={ficha.sourceUrl} className="text-electric-blue hover:underline" target="_blank" rel="noreferrer">
              {ficha.sourceUrl}
            </a>
          </p>
        ) : null}

        {ficha.affiliateUrl ? (
          <a
            href={ficha.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex rounded-full border border-white/15 px-5 py-2 text-sm text-slate-300 hover:border-electric-blue/40"
          >
            Comprar en partner ({ficha.affiliatePlatform})
          </a>
        ) : null}

        {selectedVariant?.isActive ? (
          <div className="rounded-[2rem] border border-white/10 bg-[#121212] p-8 shadow-neon">
            <AddToCartButton
              item={{
                id: selectedVariant.id,
                name: ficha.title,
                description: ficha.description ?? selectedVariant.format,
                amount: selectedVariant.priceCents,
                image: ficha.imageUrl ?? undefined,
              }}
            />
          </div>
        ) : (
          <p className="rounded-[2rem] border border-white/10 bg-[#121212] p-8 text-sm text-slate-400 shadow-neon">
            Este producto no está disponible para la venta en este momento.
          </p>
        )}

        {ficha.relatedRecipes.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Recetas relacionadas</h2>
            <ul className="space-y-2">
              {ficha.relatedRecipes.map((recipe) => (
                <li key={recipe.slug}>
                  <Link href={`/recetas/${recipe.slug}`} className="text-electric-blue hover:text-white">
                    {recipe.title} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
