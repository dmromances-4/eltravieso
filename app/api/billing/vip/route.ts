import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { createSubscriptionCheckout } from '@/lib/stripe/api'
import { getOrCreateStripeCustomer } from '@/lib/stripe/customer'
import { clientSafeErrorMessage, logServerError } from '@/lib/security/safe-error'

export async function POST() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
  }

  const priceId = process.env.STRIPE_VIP_PRICE_ID
  if (!priceId) {
    return NextResponse.json({ error: 'Membresía VIP no configurada' }, { status: 503 })
  }

  try {
    const customerId = await getOrCreateStripeCustomer(session.user.id)
    const checkout = await createSubscriptionCheckout({
      customerId,
      priceId,
      metadata: {
        billingType: 'vip',
        userId: session.user.id,
      },
      successPath: '/cuenta/membresia',
      cancelPath: '/cuenta/membresia',
    })

    return NextResponse.json({ url: checkout.url })
  } catch (error) {
    logServerError('billing-vip', error)
    return NextResponse.json(
      { error: clientSafeErrorMessage(error, 'No se pudo iniciar la suscripción') },
      { status: 500 },
    )
  }
}
