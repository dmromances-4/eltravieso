import { describe, expect, it } from 'vitest'
import {
  extractIngredientName,
  matchProductsFromCatalog,
  scoreProductMatch,
  type CatalogProductRow,
} from '@/lib/recipes/match-products'

const baseProduct = (overrides: Partial<CatalogProductRow>): CatalogProductRow => ({
  id: 'p1',
  title: 'Gin London Dry',
  slug: 'gin-london-dry',
  description: 'Botella premium',
  source: 'PROPIO',
  category: 'ALCOHOL',
  imageUrl: null,
  affiliateUrl: null,
  affiliatePlatform: 'NONE',
  metadata: null,
  variantId: 'v1',
  priceCents: 2500,
  ...overrides,
})

describe('extractIngredientName', () => {
  it('strips quantity and unit prefix', () => {
    expect(extractIngredientName('45 ml Gin')).toBe('Gin')
    expect(extractIngredientName('2 cl Vermut rojo')).toContain('Vermut')
  })
})

describe('scoreProductMatch', () => {
  it('scores token overlap against title and matchTerms', () => {
    const product = baseProduct({
      metadata: { matchTerms: ['beefeater'] },
    })
    expect(scoreProductMatch(['gin'], product)).toBeGreaterThanOrEqual(1)
    expect(scoreProductMatch(['beefeater'], product)).toBeGreaterThanOrEqual(1)
    expect(scoreProductMatch(['vodka'], product)).toBe(0)
  })
})

describe('matchProductsFromCatalog', () => {
  const catalog: CatalogProductRow[] = [
    baseProduct({ id: 'p-gin', variantId: 'v-gin' }),
    baseProduct({
      id: 'p-shaker',
      title: 'Shaker Boston',
      slug: 'shaker-boston',
      source: 'AFILIADO',
      category: 'CRISTALERIA',
      affiliateUrl: 'https://amazon.es/shaker?tag=test',
      affiliatePlatform: 'AMAZON',
      variantId: null,
      priceCents: 1999,
      metadata: { matchTerms: ['shaker', 'agitar'] },
    }),
  ]

  it('matches purchasable ingredients to catalog products', () => {
    const result = matchProductsFromCatalog(catalog, ['45 ml Gin', '10 ml Vermut'])
    expect(result.ingredientMatches).toHaveLength(1)
    expect(result.ingredientMatches[0]?.productId).toBe('p-gin')
    expect(result.ingredientMatches[0]?.variantId).toBe('v-gin')
  })

  it('returns affiliate gear for recipe context keywords', () => {
    const result = matchProductsFromCatalog(catalog, ['45 ml Gin'], {
      method: 'Agitar en shaker con hielo',
      glass: 'Cocktail',
    })
    expect(result.affiliateGear).toHaveLength(1)
    expect(result.affiliateGear[0]?.platform).toBe('AMAZON')
    expect(result.affiliateGear[0]?.affiliateUrl).toContain('amazon')
  })

  it('deduplicates by productId', () => {
    const result = matchProductsFromCatalog(catalog, ['45 ml Gin', '30 ml Gin seco'])
    expect(result.ingredientMatches).toHaveLength(1)
  })

  it('returns empty matches when catalog is unavailable', () => {
    const result = matchProductsFromCatalog([], ['45 ml Gin', '10 ml Vermut'])
    expect(result.ingredientMatches).toHaveLength(0)
    expect(result.affiliateGear).toHaveLength(0)
  })
})
