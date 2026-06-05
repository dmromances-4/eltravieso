import { unstable_cache } from 'next/cache'

import prisma from '@/lib/prisma'
import { parseIngredientList } from '@/lib/recipes/parse'
import type { AffiliateGear, MatchedIngredientProduct, RecipeProductMatches } from '@/types/marketplace'
import type { AffiliatePlatform, ProductCategory, ProductSource } from '@prisma/client'

const INGREDIENT_CATEGORIES: ProductCategory[] = [
  'INGREDIENTE',
  'ALCOHOL',
  'VERMUT',
  'SIROPE',
  'SODA',
]

const GEAR_CATEGORIES: ProductCategory[] = ['CRISTALERIA', 'MATERIAL']

const PURCHASABLE_SOURCES: ProductSource[] = ['PROPIO', 'MARKETPLACE']

export type CatalogProductRow = {
  id: string
  title: string
  slug: string
  description: string | null
  source: ProductSource
  category: ProductCategory
  imageUrl: string | null
  affiliateUrl: string | null
  affiliatePlatform: AffiliatePlatform
  metadata: unknown
  variantId: string | null
  priceCents: number
}

export function normalizeMatchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenizeForMatch(text: string): string[] {
  return normalizeMatchText(text)
    .split(' ')
    .filter((token) => token.length > 2)
}

const UNIT_PATTERN =
  /^\d+([.,]\d+)?\s*(ml|cl|l|oz|dash|dashes|tsp|tbsp|g|kg|partes?|part|splash|slice|slices|cucharada|cucharadita|gotas?|units?)?$/i

export function extractIngredientName(raw: string): string {
  const cleaned = raw
    .replace(/^\d+([.,]\d+)?\s*(ml|cl|l|oz)\s+/i, '')
    .replace(/^\d+([.,]\d+)?\s+/i, '')
    .trim()

  const parts = cleaned.split(/\s+-\s+|,\s*/).map((p) => p.trim()).filter(Boolean)
  const namePart = parts[parts.length - 1] ?? cleaned

  const tokens = namePart
    .split(/\s+/)
    .filter((t) => t.length > 0 && !UNIT_PATTERN.test(t))

  return tokens.join(' ').trim() || cleaned
}

export function getMatchTermsFromMetadata(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== 'object') return []
  const terms = (metadata as Record<string, unknown>).matchTerms
  if (!Array.isArray(terms)) return []
  return terms.map((t) => normalizeMatchText(String(t))).filter(Boolean)
}

export function scoreProductMatch(tokens: string[], product: CatalogProductRow): number {
  if (!tokens.length) return 0

  const haystack = [
    product.title,
    product.slug.replace(/-/g, ' '),
    product.description ?? '',
    ...getMatchTermsFromMetadata(product.metadata),
  ]
    .map(normalizeMatchText)
    .join(' ')

  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0)
}

function pickBestMatch(
  tokens: string[],
  products: CatalogProductRow[],
  minScore = 1,
): CatalogProductRow | null {
  let best: CatalogProductRow | null = null
  let bestScore = 0

  for (const product of products) {
    const score = scoreProductMatch(tokens, product)
    if (score >= minScore && score > bestScore) {
      best = product
      bestScore = score
    }
  }

  return best
}

async function fetchProductCatalog(): Promise<CatalogProductRow[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { priceCents: 'asc' },
        take: 1,
      },
    },
  })

  return products.map((p) => {
    const variant = p.variants[0]
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      source: p.source,
      category: p.category,
      imageUrl: p.imageUrl,
      affiliateUrl: p.affiliateUrl,
      affiliatePlatform: p.affiliatePlatform,
      metadata: p.metadata,
      variantId: variant?.id ?? null,
      priceCents: variant?.priceCents ?? 0,
    }
  })
}

const getCachedProductCatalog = unstable_cache(
  fetchProductCatalog,
  ['recipe-product-catalog'],
  { revalidate: 3600 },
)

export type RecipeMatchContext = {
  glass?: string
  method?: string
  tags?: string[]
}

function normalizeIngredientLines(ingredients: string[] | string): { name: string; amount: string }[] {
  if (Array.isArray(ingredients)) {
    return ingredients.flatMap((line) => {
      const parsed = parseIngredientList(line)
      if (parsed.length) return parsed
      const name = extractIngredientName(line)
      return name ? [{ name, amount: '—' }] : []
    })
  }
  return parseIngredientList(ingredients)
}

export function matchProductsFromCatalog(
  catalog: CatalogProductRow[],
  ingredients: string[] | string,
  context: RecipeMatchContext = {},
): RecipeProductMatches {
  const ingredientLines = normalizeIngredientLines(ingredients)

  const purchasable = catalog.filter(
    (p) =>
      PURCHASABLE_SOURCES.includes(p.source) &&
      INGREDIENT_CATEGORIES.includes(p.category) &&
      p.variantId,
  )

  const affiliateProducts = catalog.filter(
    (p) => p.source === 'AFILIADO' && GEAR_CATEGORIES.includes(p.category) && p.affiliateUrl,
  )

  const seenProductIds = new Set<string>()
  const ingredientMatches: MatchedIngredientProduct[] = []

  for (const line of ingredientLines) {
    const name = extractIngredientName(line.name)
    const tokens = tokenizeForMatch(name)
    if (!tokens.length) continue

    const match = pickBestMatch(tokens, purchasable)
    if (!match || !match.variantId || seenProductIds.has(match.id)) continue

    seenProductIds.add(match.id)
    ingredientMatches.push({
      ingredientName: line.name,
      ingredientAmount: line.amount,
      productId: match.id,
      variantId: match.variantId,
      title: match.title,
      priceCents: match.priceCents,
      source: match.source as 'PROPIO' | 'MARKETPLACE',
      imageUrl: match.imageUrl ?? undefined,
    })
  }

  const gearHaystack = normalizeMatchText(
    [context.glass ?? '', context.method ?? '', ...(context.tags ?? [])].join(' '),
  )
  const gearTokens = tokenizeForMatch(gearHaystack)

  const affiliateGear: AffiliateGear[] = []
  const seenGearIds = new Set<string>()

  for (const product of affiliateProducts) {
    const productTokens = tokenizeForMatch(
      [product.title, product.slug, ...getMatchTermsFromMetadata(product.metadata)].join(' '),
    )
    const score =
      gearTokens.length > 0
        ? productTokens.reduce((s, t) => s + (gearTokens.includes(t) ? 1 : 0), 0)
        : scoreProductMatch(productTokens, product)

    if (score < 1 || seenGearIds.has(product.id)) continue
    seenGearIds.add(product.id)

    affiliateGear.push({
      id: product.id,
      title: product.title,
      description: product.description ?? '',
      retailPriceCents: product.priceCents,
      affiliateUrl: product.affiliateUrl!,
      platform: product.affiliatePlatform,
      imageUrl: product.imageUrl ?? undefined,
    })
  }

  return { ingredientMatches, affiliateGear }
}

export async function matchProductsForRecipe(
  ingredients: string[] | string,
  context: RecipeMatchContext = {},
): Promise<RecipeProductMatches> {
  const catalog = await getCachedProductCatalog()
  return matchProductsFromCatalog(catalog, ingredients, context)
}
