'use client'

interface IngredientTechSheetProps {
  ingredients: string[]
}

interface ParsedIngredient {
  quantity: string
  name: string
  category: string
  note: string
}

const categoryKeywords: Array<[RegExp, string]> = [
  [/vermut|vermuth|rosso|bianco/i, 'Vermut'],
  [/gin/i, 'Gin'],
  [/vodka/i, 'Vodka'],
  [/ron|rum/i, 'Ron'],
  [/whis(ky|key)/i, 'Whisky'],
  [/tequila|mezcal/i, 'Tequila / Mezcal'],
  [/soda|tónica|tonic|agua/i, 'Refresco'],
  [/limón|naranja|cítrico|citrus/i, 'Cítrico'],
]

const detectCategory = (text: string) => {
  const match = categoryKeywords.find(([regex]) => regex.test(text))
  return match ? match[1] : 'Mezcla'
}

const parseIngredient = (value: string): ParsedIngredient => {
  const normalized = value.replace(/^[\s\-•]+/, '').trim()
  const quantityMatch = normalized.match(/^([0-9.,]+\s*(?:ml|cl|g|kg|oz|dash|drop|cucharadita|cucharada|tbsp|tsp|shot|copas?|glass|partes?))/i)
  const quantity = quantityMatch ? quantityMatch[1].trim() : '-'
  const rest = quantityMatch ? normalized.slice(quantityMatch[0].length).trim() : normalized
  const noteMatch = rest.match(/(chilled|garnish|refrigerado|servir|agregar|mezclar|stir|ice|con hielo|helado|frío|frozen|dry|blood orange|orange slice|olive|lemon|lima|limón|naranja)/i)
  const note = noteMatch ? noteMatch[0].trim() : ''
  const name = note ? rest.replace(noteMatch![0], '').trim().replace(/[\s,;]+$/,'') : rest
  return {
    quantity,
    name: name || rest,
    category: detectCategory(rest),
    note: note || '—',
  }
}

export default function IngredientTechSheet({ ingredients }: IngredientTechSheetProps) {
  const parsed = ingredients.map(parseIngredient)

  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-8 shadow-neon backdrop-blur-xl">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-white">Ficha técnica de ingredientes</h2>
        <p className="mt-3 text-slate-400">Detalle técnico de cada ingrediente: cantidad, categoría y notas de servicio.</p>
      </div>

      <div className="grid gap-4">
        {parsed.map((item, idx) => (
          <div key={`${item.name}-${idx}`} className="rounded-3xl border border-white/10 bg-[#0f0f0f]/90 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Ingrediente</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Cantidad</p>
                <p className="mt-2 text-lg font-semibold text-electric-yellow">{item.quantity}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Categoría</p>
                <p className="mt-2 text-sm font-semibold text-slate-100">{item.category}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Nota</p>
                <p className="mt-2 text-sm font-semibold text-slate-100">{item.note}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
