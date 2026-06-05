"use client"

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface CocktailCardProps {
  title: string
  slug: string
  rating: number
  glass: string
  ingredients: string[]
  abv: string
  kcal: number
  cover: string
}

export default function CocktailCard({ title, slug, rating, glass, ingredients, abv, kcal, cover }: CocktailCardProps) {
  const preview = ingredients.slice(0, 3).map((item) => item.replace(/\n|\r/g, ' ').trim()).join(' • ')

  return (
    <motion.article
      initial={false}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#141414] transition-all duration-300 will-change-transform hover:border-electric-yellow/30 hover:shadow-neon"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-950">
        <Image src={cover} alt={title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105 group-hover:opacity-80" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{glass}</p>
          <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-white">{title}</h3>
        </div>
      </div>
      <div className="space-y-5 p-6">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-300 border border-white/5">{abv} ABV</span>
          <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-300 border border-white/5">{kcal} kcal</span>
          <span className="flex items-center gap-1 rounded-full bg-electric-yellow/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-electric-yellow border border-electric-yellow/20">
            ★ {rating.toFixed(1)}
          </span>
        </div>
        <p className="min-h-[3rem] text-sm leading-6 text-slate-400">{preview}{ingredients.length > 3 ? ' • …' : ''}</p>
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0f0f0f]/90 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.35em] text-slate-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric-yellow opacity-40"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-electric-yellow"></span>
            </span>
            Vermut
          </div>
          <Link href={`/recetas/${slug}`} className="group/link flex items-center gap-2 text-sm font-bold uppercase tracking-[0.3em] text-electric-yellow transition-colors hover:text-white">
            Ver ficha
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover/link:translate-x-1"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
          </Link>
        </div>
      </div>
    </motion.article>
  )
}
