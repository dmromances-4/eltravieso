import prisma from '@/lib/prisma'
import { getStripe } from '@/lib/stripe/api'

export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  })

  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  if (user.stripeCustomerId) {
    return user.stripeCustomerId
  }

  const customer = await getStripe().customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id },
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}
