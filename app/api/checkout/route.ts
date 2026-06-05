import { NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe/api'
import { getOrCreateStripeCustomer } from '@/lib/stripe/customer'
import { createPendingOrder } from '@/lib/checkout/create-order'
import {
  CartValidationError,
  cartHasMarketplaceItems,
  toCheckoutItems,
  validateCartLines,
} from '@/lib/checkout/validate-cart'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { clientSafeErrorMessage, logServerError } from '@/lib/security/safe-error'
import { getAuthSession } from '@/lib/auth/session'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'checkout', RATE_LIMITS.checkout)
  if (limited) {
    return NextResponse.json({ error: limited.message }, { status: limited.status, headers: limited.headers })
  }

  let body: { items?: unknown; email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de petición inválido' }, { status: 400 })
  }

  const session = await getAuthSession()
  const emailFromBody = typeof body.email === 'string' ? body.email.trim() : ''
  const email = session?.user?.email ?? emailFromBody

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Debe proporcionar un email válido' }, { status: 400 })
  }

  try {
    const lines = await validateCartLines(body.items as { id: string; quantity: number }[])

    if (cartHasMarketplaceItems(lines) && !session?.user?.id) {
      return NextResponse.json(
        { error: 'Inicia sesión para comprar productos del marketplace' },
        { status: 401 },
      )
    }

    const order = await createPendingOrder({
      userId: session?.user?.id ?? null,
      guestEmail: email,
      lines,
    })

    let customerId: string | undefined
    if (session?.user?.id) {
      customerId = await getOrCreateStripeCustomer(session.user.id)
    }

    const stripeSession = await createCheckoutSession(toCheckoutItems(lines), email, {
      customerId,
      orderId: order.id,
    })

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: stripeSession.id },
    })

    return NextResponse.json({ url: stripeSession.url })
  } catch (error) {
    if (error instanceof CartValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[CHECKOUT_ERROR]:', error)
    logServerError('checkout', error)
    return NextResponse.json(
      { error: clientSafeErrorMessage(error, 'Error creando sesión de pago') },
      { status: 500 },
    )
  }
}
