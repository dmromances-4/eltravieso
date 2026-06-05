import type { AffiliatePlatform, ProductSource } from '@prisma/client'

export type { AffiliatePlatform, ProductSource }

export interface AffiliateGear {
  id: string
  title: string
  description: string
  retailPriceCents: number
  affiliateUrl: string
  platform: AffiliatePlatform
  imageUrl?: string
}

export interface MatchedIngredientProduct {
  ingredientName: string
  ingredientAmount: string
  productId: string
  variantId: string
  title: string
  priceCents: number
  source: Extract<ProductSource, 'PROPIO' | 'MARKETPLACE'>
  imageUrl?: string
}

export interface RecipeProductMatches {
  ingredientMatches: MatchedIngredientProduct[]
  affiliateGear: AffiliateGear[]
}

export type SplitPayoutResult = {
  productId: string
  partnerId: string | null
  platformCutCents: number
  partnerCutCents: number
}
