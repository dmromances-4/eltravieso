import type { Metadata } from 'next'
import CartClient from './CartClient'

export const metadata: Metadata = {
  title: 'Carrito | Vermut El Travieso',
  description: 'Revisa los productos de tu carrito antes de pasar por caja.',
}

export default function CartPage() {
  return <CartClient />
}
