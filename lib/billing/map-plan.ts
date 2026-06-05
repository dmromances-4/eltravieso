import type { BarProfile, MapPlanTier } from '@prisma/client'

export function isMapPlanActive(bar: Pick<BarProfile, 'mapPlan' | 'mapPlanExpiresAt' | 'isPremium'>): boolean {
  if (bar.mapPlan === 'FREE') return false
  if (bar.mapPlanExpiresAt && bar.mapPlanExpiresAt < new Date()) return false
  return bar.isPremium
}

export function mapPlanLabel(tier: MapPlanTier): string {
  switch (tier) {
    case 'FEATURED':
      return 'Top del Barrio'
    case 'BOOKING_PLUS':
      return 'Booking Plus'
    default:
      return 'Gratis'
  }
}

export function mapPlanFromPriceId(priceId: string | undefined): MapPlanTier | null {
  if (!priceId) return null
  if (priceId === process.env.STRIPE_MAP_FEATURED_PRICE_ID) return 'FEATURED'
  if (priceId === process.env.STRIPE_MAP_BOOKING_PRICE_ID) return 'BOOKING_PLUS'
  return null
}

export function applyMapPlanFields(tier: MapPlanTier, periodEnd: Date | null): {
  mapPlan: MapPlanTier
  mapPlanExpiresAt: Date | null
  isPremium: boolean
  bookingWidgetEnabled: boolean
} {
  const active = tier !== 'FREE'
  return {
    mapPlan: tier,
    mapPlanExpiresAt: periodEnd,
    isPremium: active,
    bookingWidgetEnabled: tier === 'BOOKING_PLUS' || tier === 'FEATURED',
  }
}
