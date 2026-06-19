import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/api'
import { syncSaleToHolded } from '@/lib/holded/api'
import { buildHoldedOrderFromSession, processStripeWebhookEvent } from '@/lib/stripe/webhook-handlers'
import { buildRequestContext, runWithRequestContext } from '@/lib/observability/request-context'
import { isWebhookProcessed, markWebhookProcessed } from '@/lib/observability/webhook-idempotency'
import { auditEvent } from '@/lib/observability/audit'
import { clientSafeErrorMessage, logServerError } from '@/lib/security/safe-error'

export async function POST(request: Request) {
  return runWithRequestContext(buildRequestContext(request), async () => {
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  if (!webhookSecret) {
    logServerError('stripe-webhook', new Error('STRIPE_WEBHOOK_SECRET is not configured'))
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    logServerError('stripe-webhook', error, { extra: { phase: 'signature_verification' } })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (await isWebhookProcessed(event.id)) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  void auditEvent({
    action: 'webhook.stripe.received',
    request,
    resourceType: 'StripeEvent',
    resourceId: event.id,
    metadata: { eventType: event.type },
  })

  try {
    await processStripeWebhookEvent(event)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'payment' && session.metadata?.kind === 'shop_order') {
        const order = await buildHoldedOrderFromSession(session)
        const result = await syncSaleToHolded(order)
        await markWebhookProcessed(event.id, 'stripe')
        return NextResponse.json({ success: true, holded: result })
      }
    }

    await markWebhookProcessed(event.id, 'stripe')
    return NextResponse.json({ received: true })
  } catch (error) {
    logServerError('stripe-webhook', error, { extra: { eventId: event.id, eventType: event.type } })
    return NextResponse.json(
      { error: clientSafeErrorMessage(error, 'Error procesando el webhook') },
      { status: 500 },
    )
  }
  })
}
