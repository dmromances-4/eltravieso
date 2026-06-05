'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart/CartContext'

type RecipeAddToCartProps = {
  variantId: string
  title: string
  priceCents: number
  imageUrl?: string
}

export default function RecipeAddToCart({ variantId, title, priceCents, imageUrl }: RecipeAddToCartProps) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addToCart({
      id: variantId,
      name: title,
      description: title,
      amount: priceCents,
      quantity: 1,
      image: imageUrl,
    })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2000)
  }

  const price = (priceCents / 100).toFixed(2)

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="mt-2 self-start border border-transparent bg-electric-red px-3 py-1 text-[10px] font-black uppercase text-white transition-all duration-150 hover:border-electric-red hover:bg-black hover:text-electric-red"
    >
      {added ? '¡Añadido!' : `Pillar botella local (${price}€)`}
    </button>
  )
}
