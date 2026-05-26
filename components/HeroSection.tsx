'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'

export default function HeroSection() {
  const { scrollYProgress } = useScroll()
  const drift = useTransform(scrollYProgress, [0, 1], ['0px', '120px'])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] } }
  }

  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] pt-32 pb-24 sm:pt-40 sm:pb-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,204,0,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(0,163,224,0.08),_transparent_25%)]" />
      <div className="absolute right-8 top-12 hidden h-32 w-32 rounded-full border border-electric-yellow/20 bg-electric-yellow/5 blur-[40px] sm:block" />
      <div className="absolute left-6 top-32 hidden h-40 w-40 rounded-full border border-electric-blue/25 bg-electric-blue/5 blur-[40px] sm:block" />
      
      <div className="relative mx-auto max-w-7xl px-6 sm:px-8">
        <div className="grid gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div variants={itemVariants}>
              <span className="inline-flex rounded-full border border-electric-yellow/20 bg-electric-yellow/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-electric-yellow shadow-[0_0_15px_rgba(255,204,0,0.1)]">
                Vermut Premium Canalla
              </span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl font-display font-bold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1]">
              Llenamos el vaso, <br/> no vaciamos el bolsillo.
            </motion.h1>
            
            <motion.p variants={itemVariants} className="max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
              Brutalismo refinado, scroll suave y coctelería urbana para paladares que conocen la noche. Experiencia diseñada para rebeldes del sector spirits.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-wrap gap-4 pt-4">
              <Link href="#catalogo" className="inline-flex items-center justify-center rounded-full bg-electric-yellow px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-black transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,204,0,0.3)]">
                Ver Recetas
              </Link>
              <Link href="/shop" className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition-all hover:border-electric-yellow/40 hover:bg-white/10">
                Ir a la Tienda
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-[#121212]/90 p-6 shadow-[0_0_50px_rgba(255,204,0,0.05)] backdrop-blur-xl"
          >
            <motion.div
              style={{ y: drift }}
              className="pointer-events-none absolute -right-10 top-8 h-40 w-40 rounded-full border border-electric-blue/25 bg-electric-blue/5 blur-2xl"
            />
            <div className="relative flex h-[460px] flex-col justify-between overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#111111] via-[#141414] to-[#0a0a0a] p-8 border border-white/5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,204,0,0.05),transparent_60%)]" />
              
              <div className="relative flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/5 bg-[#1a1a1a]/80 p-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-300">
                  <span className="text-electric-yellow flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-electric-yellow animate-pulse"></span>
                    Live Stats
                  </span>
                  <span>EL TRAVIESO</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-center">
                    <p className="text-3xl font-display font-bold text-white mb-1">+120</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Recetas</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-center">
                    <p className="text-3xl font-display font-bold text-white mb-1">100%</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Actitud</p>
                  </div>
                </div>
              </div>
              
              <div className="relative rounded-[2rem] border border-electric-yellow/10 bg-black/40 p-6 backdrop-blur-sm">
                <p className="text-sm leading-7 text-slate-300 font-medium italic">
                  "El vermut no es solo una bebida, es una declaración de intenciones. Un trago oscuro cargado de actitud."
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
