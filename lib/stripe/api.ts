import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim())
}

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2022-11-15',
    })
  }
  return stripeClient
}

export type CheckoutItem = {
  id: string
  productId?: string
  sku?: string
  name: string
  description: string
  amount: number
  quantity: number
  currency?: string
  image?: string
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

export async function createCheckoutSession(
  items: CheckoutItem[],
  customerEmail: string,
  options?: {
    customerId?: string
    orderId?: string
    metadata?: Record<string, string>
  },
) {
  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer: options?.customerId,
    customer_email: options?.customerId ? undefined : customerEmail,
    line_items: items.map((item) => ({
      price_data: {
        currency: item.currency ?? 'eur',
        product_data: {
          name: item.name,
          description: item.description,
          images: item.image ? [item.image] : [],
        },
        unit_amount: item.amount,
      },
      quantity: item.quantity,
    })),
    metadata: {
      source: 'vermut-el-travieso',
      kind: 'shop_order',
      ...(options?.orderId ? { orderId: options.orderId } : {}),
      ...options?.metadata,
    },
    success_url: `${appUrl()}/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/cart`,
  })

  return session
}

export async function createSubscriptionCheckout(params: {
  customerId: string
  priceId: string
  metadata: Record<string, string>
  successPath: string
  cancelPath: string
}) {
  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    customer: params.customerId,
    line_items: [{ price: params.priceId, quantity: 1 }],
    metadata: {
      source: 'vermut-el-travieso',
      ...params.metadata,
    },
    subscription_data: {
      metadata: params.metadata,
    },
    success_url: `${appUrl()}${params.successPath}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}${params.cancelPath}`,
  })

  return session
}

export async function createBillingPortalSession(customerId: string, returnPath: string) {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl()}${returnPath}`,
  })
}
