import type Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { getStripe } from '@/lib/stripe/api'
import { applyMapPlanFields, mapPlanFromPriceId } from '@/lib/billing/map-plan'
import { confirmOrderFromStripeSession } from '@/lib/checkout/create-order'
import { fulfillVipDrop } from '@/lib/membership/fulfill-drop'
import { withSentrySpan } from '@/lib/observability/sentry-span'
import { auditEvent } from '@/lib/observability/audit'
import type { MapPlanTier, MembershipStatus } from '@prisma/client'

function subscriptionPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const end = subscription.current_period_end
  return end ? new Date(end * 1000) : null
}

function membershipStatusFromStripe(status: Stripe.Subscription.Status): MembershipStatus {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'ACTIVE'
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE'
    case 'canceled':
    case 'incomplete_expired':
      return 'CANCELLED'
    default:
      return 'NONE'
  }
}

async function handleVipSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId
  if (!userId) return

  const status = membershipStatusFromStripe(subscription.status)
  const expiresAt = subscriptionPeriodEnd(subscription)

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: subscription.id,
      membershipStatus: status,
      membershipExpiresAt: expiresAt,
    },
  })

  if (status === 'ACTIVE') {
    const dropMonth = new Date().toISOString().slice(0, 7)
    await fulfillVipDrop(userId, dropMonth)
  }
}

async function handleMapSubscription(subscription: Stripe.Subscription) {
  const barProfileId = subscription.metadata.barProfileId
  if (!barProfileId) return

  const priceId = subscription.items.data[0]?.price?.id
  let tier: MapPlanTier | null = mapPlanFromPriceId(priceId)

  if (!tier && subscription.metadata.mapPlan) {
    tier = subscription.metadata.mapPlan as MapPlanTier
  }

  if (!tier) return

  const active = subscription.status === 'active' || subscription.status === 'trialing'
  const periodEnd = subscriptionPeriodEnd(subscription)

  if (!active) {
    await prisma.barProfile.update({
      where: { id: barProfileId },
      data: {
        stripeSubscriptionId: subscription.id,
        ...applyMapPlanFields('FREE', periodEnd),
      },
    })
    return
  }

  await prisma.barProfile.update({
    where: { id: barProfileId },
    data: {
      stripeSubscriptionId: subscription.id,
      ...applyMapPlanFields(tier, periodEnd),
    },
  })
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const kind = session.metadata?.kind

  if (session.mode === 'subscription') {
    const subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

    if (!subscriptionId) return

    const subscription = await getStripe().subscriptions.retrieve(subscriptionId)

    if (session.metadata?.billingType === 'vip') {
      await handleVipSubscription(subscription)
      return
    }

    if (session.metadata?.billingType === 'map_plan') {
      await handleMapSubscription(subscription)
    }
    return
  }

  if (kind !== 'shop_order') return

  const orderId = session.metadata?.orderId
  if (!orderId && !session.id) return

  let stripeSessionId = session.id
  if (!stripeSessionId) return

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  await confirmOrderFromStripeSession({
    stripeSessionId,
    stripePaymentId: paymentIntentId,
  })

  void auditEvent({
    action: 'checkout.completed',
    resourceType: 'Order',
    resourceId: orderId ?? stripeSessionId,
    metadata: { stripeSessionId, paymentIntentId },
  })
}

export async function processStripeWebhookEvent(event: Stripe.Event) {
  return withSentrySpan(
    `stripe.webhook.${event.type}`,
    'stripe.webhook',
    async () => {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
      break
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      if (subscription.metadata.billingType === 'vip') {
        await handleVipSubscription(subscription)
      } else if (subscription.metadata.billingType === 'map_plan') {
        await handleMapSubscription(subscription)
      }
      break
    }
    default:
      break
  }
    },
    { eventType: event.type, eventId: event.id },
  )
}

export async function buildHoldedOrderFromSession(session: Stripe.Checkout.Session) {
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

  return {
    contact: {
      name: fullSession.customer_details?.name ?? 'Cliente Vermut',
      email: fullSession.customer_details?.email ?? 'cliente@vermut.com',
      phone: fullSession.customer_details?.phone ?? undefined,
    },
    items,
    reference: fullSession.id,
  }
}
