import AlcoholCard from '@/components/AlcoholCard'
import alcoholData from '@/data/alcohol-encyclopedia.json'
import type { AlcoholRecord } from '@/types/alcohol'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Enciclopedia de Alcoholes | Vermut El Travieso',
  description: 'Conoce lo que bebes. Fichas técnicas, procesos y origen de los destilados más importantes en la mixología.',
}

export default function AlcoholesPage() {
  const alcohols = alcoholData as unknown as AlcoholRecord[]

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="mb-16 space-y-4">
          <p className="inline-flex rounded-full border border-electric-blue/20 bg-electric-blue/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-electric-blue">
            Saber Beber
          </p>
          <h1 className="text-5xl font-display font-bold tracking-tight text-white sm:text-6xl">
            Enciclopedia <span className="text-electric-yellow italic pr-2">Líquida</span>.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-400">
            Fichas técnicas, métodos de destilación y origen de los destilados fundamentales que todo buen travieso debe conocer.
          </p>
        </div>

        <div className="mb-12 flex flex-wrap gap-3">
          <button className="rounded-full bg-white px-5 py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors">Todos</button>
          <button className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:border-electric-yellow hover:text-electric-yellow">Destilados</button>
          <button className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:border-electric-yellow hover:text-electric-yellow">Licores</button>
          <button className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:border-electric-yellow hover:text-electric-yellow">Aromatizados</button>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {alcohols.map((alcohol) => (
            <AlcoholCard key={alcohol.id} alcohol={alcohol} />
          ))}
        </div>
      </div>
    </main>
  )
}
