'use client'

import { useState } from 'react'
import type { AlcoholRecord } from '@/types/alcohol'
import { motion, AnimatePresence } from 'framer-motion'

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
    <article className="group overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#111111] transition-all duration-300 hover:-translate-y-1 hover:border-electric-yellow/30 hover:shadow-[0_0_40px_rgba(255,204,0,0.05)]">
      <div className="p-8">
        <div className="space-y-3 mb-8">
          <div className="flex justify-between items-start">
            <p className="inline-flex rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {category}
            </p>
            {subcategory && (
              <span className="text-xs uppercase tracking-widest text-slate-500">{subcategory}</span>
            )}
          </div>
          <h3 className="text-3xl font-display font-bold tracking-tight text-white group-hover:text-electric-yellow transition-colors">{identity.name_exact}</h3>
          <p className="text-sm font-medium text-slate-400">{identity.brand} · {identity.producer}</p>
        </div>

        <div className="grid gap-6 text-sm text-slate-300 sm:grid-cols-2 mb-6">
          <div className="space-y-2">
            <p className="font-bold uppercase tracking-widest text-[10px] text-slate-500">Origen</p>
            <div className="flex flex-col gap-1">
              <span className="text-white font-medium">{identity.country}</span>
              <span>{identity.region}</span>
              {identity.sub_region && <span className="text-slate-400">{identity.sub_region}</span>}
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-bold uppercase tracking-widest text-[10px] text-slate-500">Técnica</p>
            <div className="flex flex-col gap-1">
              <span className="text-white font-medium">{technical.abv} % ABV</span>
              <span>{technical.raw_material}</span>
              <span className="text-slate-400 truncate">{technical.distillation_method}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-4 flex items-center justify-between rounded-full border border-white/10 bg-[#161616] px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-electric-yellow"
        >
          <span>{isExpanded ? 'Ocultar detalles' : 'Ver ficha técnica completa'}</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
            className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-6 space-y-6 border-t border-white/10 mt-6">
                <div className="grid gap-6 text-sm text-slate-300 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="font-bold uppercase tracking-widest text-[10px] text-slate-500">Crianza</p>
                    <div className="flex flex-col gap-1">
                      <span>{alcohol.chronology.vintage || 'Sin añada'}</span>
                      <span>{alcohol.chronology.maturation_time}</span>
                      <span className="text-slate-400">{alcohol.chronology.barrel_type}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold uppercase tracking-widest text-[10px] text-slate-500">Mercado</p>
                    <div className="flex flex-col gap-1">
                      <span className="text-white font-medium">{market.production_status}</span>
                      <span>{market.rarity}</span>
                      <span className="text-slate-400 text-xs">{market.bottle_formats.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-[#0f0f0f] p-5 text-sm text-slate-300">
                  <p className="font-bold uppercase tracking-widest text-[10px] text-electric-yellow mb-3">Notas de cata</p>
                  <div className="space-y-3">
                    <p><span className="text-slate-500 mr-2">Vista:</span> {alcohol.sensory.sight}</p>
                    <p><span className="text-slate-500 mr-2">Nariz:</span> {alcohol.sensory.nose}</p>
                    <p><span className="text-slate-500 mr-2">Boca:</span> {alcohol.sensory.palate}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-[#0f0f0f] p-5 text-sm text-slate-300">
                  <p className="font-bold uppercase tracking-widest text-[10px] text-electric-yellow mb-3">Valor didáctico</p>
                  <p className="leading-relaxed mb-4">{didactic.history_context}</p>
                  <div className="border-t border-white/5 pt-3">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Mixología</p>
                    <p className="font-medium text-white">{didactic.mixology_role}</p>
                    <p className="mt-1 text-slate-400 text-xs">Ideal en: {didactic.iconic_cocktails.join(', ')}</p>
                  </div>
                </div>

                <div className="text-[9px] uppercase tracking-widest text-slate-600 border-t border-white/5 pt-4">
                  <p>{producer_group} · {denomination_of_origin} · {producer_type}</p>
                  <p className="mt-1 font-mono">{family_id}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  )
}
