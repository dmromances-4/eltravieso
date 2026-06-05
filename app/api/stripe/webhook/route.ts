import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/api'
import { syncSaleToHolded } from '@/lib/holded/api'
import prisma from '@/lib/prisma'
import { clientSafeErrorMessage } from '@/lib/security/safe-error'

async function markWebhookProcessed(eventId: string, source: string): Promise<boolean> {
  try {
    await prisma.processedWebhook.create({
      data: { eventId, source },
    })
    return true
  } catch (error) {
    const code = (error as { code?: string })?.code
    if (code === 'P2002') return false
    throw error
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  if (!webhookSecret) {
    console.error('[STRIPE_WEBHOOK] STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    console.error('[STRIPE_WEBHOOK] Signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const alreadyProcessed = await prisma.processedWebhook.findUnique({
    where: { eventId: event.id },
  })
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  if (event.type !== 'checkout.session.completed') {
    await markWebhookProcessed(event.id, 'stripe')
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  if (!session.id) {
    await markWebhookProcessed(event.id, 'stripe')
    return NextResponse.json({ received: true })
  }

  try {
    const fullSession = await getStripe().checkout.sessions.retrieve(session.id, {
      expand: ['line_items'],
    })

    const lineItems = fullSession.line_items?.data ?? []
    const items =
      lineItems.length > 0
        ? lineItems.map((item) => ({
            description: item.description ?? item.price?.product?.toString() ?? 'Producto Vermut',
            quantity: item.quantity ?? 1,
            unitPrice: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
            taxId: 'VAT',
          }))
        : [
            {
              description: 'Pedido Stripe Vermut',
              quantity: 1,
              unitPrice: fullSession.amount_total ? fullSession.amount_total / 100 : 0,
              taxId: 'VAT',
            },
          ]

    const order = {
      contact: {
        name: fullSession.customer_details?.name ?? 'Cliente Vermut',
        email: fullSession.customer_details?.email ?? 'cliente@vermut.com',
        phone: fullSession.customer_details?.phone ?? undefined,
      },
      items,
      reference: fullSession.id,
    }

    const result = await syncSaleToHolded(order)
    await markWebhookProcessed(event.id, 'stripe')
    return NextResponse.json({ success: true, holded: result })
  } catch (error) {
    console.error('[STRIPE_WEBHOOK] Holded sync failed:', error)
    return NextResponse.json(
      { error: clientSafeErrorMessage(error, 'Error procesando el webhook') },
      { status: 500 },
    )
  }
}
