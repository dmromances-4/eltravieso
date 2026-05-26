import { NextResponse } from 'next/server'
import { createCheckoutSession, type CheckoutItem } from '@/lib/stripe/api'
import { fetchHoldedStock } from '@/lib/holded/api'

export async function POST(request: Request) {
  const body = await request.json()
  const items = body.items as CheckoutItem[] | undefined
  const email = body.email as string | undefined

  if (!items || !items.length) {
    return NextResponse.json({ error: 'No hay artículos en el carrito' }, { status: 400 })
  }

  if (!email) {
    return NextResponse.json({ error: 'Debe proporcionar un email' }, { status: 400 })
  }

  try {
    await Promise.all(
      items.map(async (item) => {
        if (item.id) {
          await fetchHoldedStock(item.id)
        }
      })
    )

    const session = await createCheckoutSession(items, email)
    return NextResponse.json({ url: session.url })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error creando sesión de Stripe' }, { status: 500 })
  }
}
