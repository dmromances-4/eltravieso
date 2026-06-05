import type { ProductSource } from '@prisma/client'

export type SplitLineInput = {
  orderItemId: string
  productId: string
  partnerId: string | null
  source: ProductSource
  commissionRateBps: number
  grossCents: number
}

export type SplitLineResult = {
  orderItemId: string
  productId: string
  partnerId: string | null
  grossCents: number
  platformCents: number
  partnerCents: number
}

export function calculateSplitLine(line: SplitLineInput): SplitLineResult {
  if (line.source === 'MARKETPLACE' && line.partnerId) {
    const platformCents = Math.round((line.grossCents * line.commissionRateBps) / 10000)
    const partnerCents = line.grossCents - platformCents
    return {
      orderItemId: line.orderItemId,
      productId: line.productId,
      partnerId: line.partnerId,
      grossCents: line.grossCents,
      platformCents,
      partnerCents,
    }
  }

  return {
    orderItemId: line.orderItemId,
    productId: line.productId,
    partnerId: null,
    grossCents: line.grossCents,
    platformCents: line.grossCents,
    partnerCents: 0,
  }
}

export function calculateOrderSplits(lines: SplitLineInput[]): SplitLineResult[] {
  return lines.map(calculateSplitLine)
}
