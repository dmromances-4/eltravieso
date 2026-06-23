'use client'

import { useState } from 'react'
import type { AlcoholRecord } from '@/types/alcohol'
import { Link } from '@/i18n/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { MetaChip } from '@/components/ui/MetaChip'
import { cn } from '@/lib/utils'

interface AlcoholCardProps {
  alcohol: AlcoholRecord
}

export default function AlcoholCard({ alcohol }: AlcoholCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    identity,
    technical,
    market,
    didactic,
    category,
    subcategory,
    family_id,
    producer_group,
    denomination_of_origin,
    producer_type,
  } = alcohol

  return (
    <article className="group overflow-hidden rounded-card border border-white/10 bg-[var(--surface-panel)] transition-colors hover:border-white/20">
      <div className="p-6 sm:p-8">
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <MetaChip tone="blue">{category}</MetaChip>
            {subcategory ? <span className="text-xs text-slate-500">{subcategory}</span> : null}
          </div>
          <h3 className="font-display text-2xl font-semibold text-white transition-colors group-hover:text-electric-yellow">
            <Link href={`/alcoholes/${alcohol.slug}`} className="hover:underline">
              {identity.name_exact}
            </Link>
          </h3>
          <p className="text-sm text-slate-400">
            {identity.brand} · {identity.producer}
          </p>
        </div>

        <div className="mb-6 grid gap-6 text-sm text-slate-300 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-caption text-slate-500">Origen</p>
            <div className="flex flex-col gap-1">
              <span className="font-medium text-white">{identity.country}</span>
              <span>{identity.region}</span>
              {identity.sub_region ? <span className="text-slate-400">{identity.sub_region}</span> : null}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-caption text-slate-500">Técnica</p>
            <div className="flex flex-col gap-1">
              <span className="font-medium text-white">{technical.abv} % ABV</span>
              <span>{technical.raw_material}</span>
              <span className="truncate text-slate-400">{technical.distillation_method}</span>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/alcoholes/${alcohol.slug}`}
            className="inline-flex items-center justify-center rounded-pill border border-electric-blue/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-electric-blue transition hover:bg-electric-blue/10"
          >
            Ver ficha
          </Link>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex flex-1 items-center justify-between rounded-pill border border-white/10 bg-charcoal px-5 py-3 text-sm font-medium text-white transition-colors hover:border-electric-blue/30 focus:outline-none focus:ring-2 focus:ring-electric-blue/40"
          >
            <span>{isExpanded ? 'Ocultar detalles' : 'Vista rápida'}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn('transition-transform duration-300', isExpanded && 'rotate-180')}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        </div>

        <AnimatePresence>
          {isExpanded ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-6 space-y-6 border-t border-white/10 pt-6">
                <div className="grid gap-6 text-sm text-slate-300 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-caption text-slate-500">Crianza</p>
                    <div className="flex flex-col gap-1">
                      <span>{alcohol.chronology.vintage || 'Sin añada'}</span>
                      <span>{alcohol.chronology.maturation_time}</span>
                      <span className="text-slate-400">{alcohol.chronology.barrel_type}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-caption text-slate-500">Mercado</p>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-white">{market.production_status}</span>
                      <span>{market.rarity}</span>
                      <span className="text-xs text-slate-400">{market.bottle_formats.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-card border border-white/5 bg-charcoal p-5 text-sm text-slate-300">
                  <p className="mb-3 text-caption text-electric-blue">Notas de cata</p>
                  <div className="space-y-3">
                    <p><span className="mr-2 text-slate-500">Vista:</span> {alcohol.sensory.sight}</p>
                    <p><span className="mr-2 text-slate-500">Nariz:</span> {alcohol.sensory.nose}</p>
                    <p><span className="mr-2 text-slate-500">Boca:</span> {alcohol.sensory.palate}</p>
                  </div>
                </div>

                <div className="rounded-card border border-white/5 bg-charcoal p-5 text-sm text-slate-300">
                  <p className="mb-3 text-caption text-electric-blue">Valor didáctico</p>
                  <p className="mb-4 leading-relaxed">{didactic.history_context}</p>
                  <div className="border-t border-white/5 pt-3">
                    <p className="mb-2 text-caption text-slate-500">Mixología</p>
                    <p className="font-medium text-white">{didactic.mixology_role}</p>
                    <p className="mt-1 text-xs text-slate-400">Ideal en: {didactic.iconic_cocktails.join(', ')}</p>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 text-xs text-slate-600">
                  <p>{producer_group} · {denomination_of_origin} · {producer_type}</p>
                  <p className="mt-1 font-mono">{family_id}</p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </article>
  )
}
