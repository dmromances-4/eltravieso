'use client'

import { useState } from 'react'
import { useCart, type CartItem } from '@/lib/cart/CartContext'

type AddToCartButtonProps = {
  item: Omit<CartItem, 'quantity'>
}

export default function AddToCartButton({ item }: AddToCartButtonProps) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addToCart({ ...item, quantity })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Cantidad</span>
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#161616] p-1">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Restar unidad"
            className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-bold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Sumar unidad"
            className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-electric-yellow px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-black transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,204,0,0.3)]"
      >
        {added ? '¡Añadido!' : 'Añadir al carrito'}
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
      </button>
    </div>
  )
}
