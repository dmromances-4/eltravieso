import Link from 'next/link'

import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Carrito | Vermut El Travieso',
  description: 'Revisa los productos de tu carrito antes de pasar por caja.',
}

export default function CartPage() {
  // Simulación de carrito - Esto se conectaría con Zustand/Context
  const mockItems = [
    {
      id: "prod_1",
      name: "El Travieso Vermut Rojo",
      description: "Botella 75cl - 15% Vol.",
      amount: 1490,
      quantity: 2,
      image: ""
    }
  ]

  const total = mockItems.reduce((acc, item) => acc + (item.amount * item.quantity), 0)

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 text-white">
      <div className="mx-auto max-w-4xl px-6 sm:px-8">
        <Link href="/shop" className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-electric-yellow mb-12">
          <span className="transition-transform group-hover:-translate-x-1">←</span> Seguir comprando
        </Link>
        
        <h1 className="text-4xl font-display font-bold tracking-tight text-white sm:text-5xl mb-8">Tu Carrito</h1>

        {mockItems.length === 0 ? (
          <div className="rounded-[2.5rem] border border-white/10 bg-[#121212] p-16 text-center shadow-neon">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="text-4xl">🛒</span>
            </div>
            <h2 className="text-2xl font-display text-white mb-4">Tu carrito está vacío</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">Parece que aún no has añadido nada. Visita nuestra tienda para ver nuestros productos.</p>
            <Link href="/shop" className="inline-flex items-center justify-center rounded-full bg-electric-yellow px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-black transition-all hover:brightness-110">
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
            <div className="space-y-4">
              {mockItems.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 rounded-[2rem] border border-white/10 bg-[#121212] p-6 shadow-neon">
                  <div className="h-24 w-24 shrink-0 rounded-2xl bg-[#161616] border border-white/5 flex items-center justify-center text-4xl">
                    🥃
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold text-white">{item.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between w-full sm:w-auto gap-8">
                    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#161616] p-1">
                      <button className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors">−</button>
                      <span className="w-4 text-center text-sm font-bold">{item.quantity}</span>
                      <button className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors">+</button>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-electric-yellow">{((item.amount * item.quantity) / 100).toFixed(2)} €</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#121212] p-8 h-fit shadow-neon">
              <h2 className="text-xl font-bold text-white mb-6">Resumen</h2>
              <div className="space-y-4 border-b border-white/10 pb-6 mb-6">
                <div className="flex justify-between text-slate-400 text-sm">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">{(total / 100).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-slate-400 text-sm">
                  <span>Envío</span>
                  <span className="text-electric-yellow font-medium text-xs uppercase tracking-widest">Gratis</span>
                </div>
              </div>
              <div className="flex justify-between text-white font-bold mb-8">
                <span>Total</span>
                <span className="text-2xl text-electric-yellow">{(total / 100).toFixed(2)} €</span>
              </div>
              <Link href="/checkout" className="flex w-full items-center justify-center rounded-full bg-electric-yellow px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-black transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,204,0,0.3)]">
                Procesar pedido
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
