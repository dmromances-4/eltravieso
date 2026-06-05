import Stripe from 'stripe'

let stripeClient: Stripe | null = null

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

export async function createCheckoutSession(items: CheckoutItem[], customerEmail: string) {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: customerEmail,
    line_items: items.map((item) => ({
      price_data: {
        currency: item.currency ?? 'eur',
        product_data: {
          name: item.name,
          description: item.description,
          images: item.image ? [item.image] : []
        },
        unit_amount: item.amount
      },
      quantity: item.quantity
    })),
    metadata: {
      source: 'vermut-el-travieso'
    },
    success_url: `${url}/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${url}/cart`
  })

  return session
}
