import prisma from "@/lib/prisma";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Tienda | Vermut El Travieso',
  description: 'Compra el vermut más canalla online. Botellas, packs y merchandising oficial.',
}

export default async function ShopPage() {
  const products = await prisma.product.findMany({
    orderBy: { priceCents: 'asc' }
  })

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 text-white">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="mb-16 space-y-4">
          <p className="inline-flex rounded-full border border-electric-yellow/20 bg-electric-yellow/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-electric-yellow">
            Tienda Oficial
          </p>
          <h1 className="text-5xl font-display font-bold tracking-tight text-white sm:text-6xl">
            Llévate la <span className="text-electric-yellow italic pr-2">actitud</span> a casa.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-400">
            Packs de degustación, botellas individuales y merch para los que saben disfrutar de la noche.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-[2.5rem] border border-white/10 bg-[#111111]/90 p-16 text-center shadow-neon backdrop-blur-xl">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="text-4xl">🛒</span>
            </div>
            <h2 className="text-2xl font-display text-white mb-2">Tienda vacía</h2>
            <p className="text-slate-400">No hay productos disponibles en este momento. Vuelve más tarde.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(product => (
              <article key={product.id} className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#121212] transition-all duration-300 hover:-translate-y-2 hover:border-electric-yellow/30 hover:shadow-neon">
                <div className="relative aspect-square overflow-hidden bg-[#161616] p-8">
                  {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.title} fill className="object-contain transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-6xl opacity-20">🥃</span>
                    </div>
                  )}
                </div>
                <div className="p-8">
                  <h2 className="text-2xl font-display font-bold text-white mb-2">{product.title}</h2>
                  <p className="text-sm text-slate-400 mb-6 min-h-[40px] line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <p className="text-2xl font-bold text-electric-yellow">{(product.priceCents / 100).toFixed(2)} €</p>
                    <button 
                      className="rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-electric-yellow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
