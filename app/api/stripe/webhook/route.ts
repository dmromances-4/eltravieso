import { NextResponse } from 'next/server'
import { syncSaleToHolded } from '@/lib/holded/api'

export async function POST(request: Request) {
  const payload = await request.json()
  const eventType = payload.type
  const data = payload.data?.object

  if (eventType !== 'checkout.session.completed' || !data) {
    return NextResponse.json({ received: true })
  }

  try {
    const order = {
      contact: {
        name: data.customer_details?.name ?? 'Cliente Vermut',
        email: data.customer_details?.email ?? 'cliente@vermut.com',
        phone: data.customer_details?.phone ?? undefined
      },
      items: [
        {
          description: 'Pedido Stripe Vermut',
          quantity: 1,
          unitPrice: data.amount_total ? data.amount_total / 100 : 0,
          taxId: 'VAT' // Ajustar según configuración Holded
        }
      ],
      reference: data.id
    }

    const result = await syncSaleToHolded(order)
    return NextResponse.json({ success: true, holded: result })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Holded sync failed' }, { status: 500 })
  }
}
