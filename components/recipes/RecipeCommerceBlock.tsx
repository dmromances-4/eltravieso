import AffiliateGearCard from '@/components/marketplace/AffiliateGearCard'
import RecipeAddToCart from '@/components/recipes/RecipeAddToCart'
import type { RecipeProductMatches } from '@/types/marketplace'

type RecipeCommerceBlockProps = {
  matches: RecipeProductMatches
  ingredients: string[]
}

export default function RecipeCommerceBlock({ matches, ingredients }: RecipeCommerceBlockProps) {
  const { ingredientMatches, affiliateGear } = matches
  const matchByIngredient = new Map(ingredientMatches.map((m) => [m.ingredientName.toLowerCase(), m]))

  if (!ingredientMatches.length && !affiliateGear.length) return null

  return (
    <div className="space-y-12">
      {ingredientMatches.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-display font-bold uppercase text-electric-blue">Compra cruzada</h2>
          <ul className="space-y-3">
            {ingredients.map((raw, idx) => {
              const match = matchByIngredient.get(raw.toLowerCase())
                ?? ingredientMatches.find((m) => raw.toLowerCase().includes(m.ingredientName.toLowerCase()))
              if (!match) return null

              return (
                <li
                  key={`${match.productId}-${idx}`}
                  className="flex flex-col border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="text-sm font-bold text-white">{match.ingredientName}</span>
                    <span className="ml-2 text-xs text-electric-yellow">{match.ingredientAmount}</span>
                    {match.source === 'MARKETPLACE' && (
                      <span className="ml-2 text-[10px] uppercase text-slate-500">· marketplace</span>
                    )}
                  </div>
                  <RecipeAddToCart
                    variantId={match.variantId}
                    title={match.title}
                    priceCents={match.priceCents}
                    imageUrl={match.imageUrl}
                  />
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {affiliateGear.length > 0 && (
        <section className="space-y-4 border-t border-white/10 pt-8">
          <h2 className="text-xl font-display font-bold uppercase text-electric-blue">
            Utillaje de combate recomendado
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {affiliateGear.map((gear) => (
              <AffiliateGearCard key={gear.id} gear={gear} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
