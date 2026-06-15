# Mapeo cóctel → historia

## Perfil narrativo

Por cada slug en `data/cocktails.json` se genera un `CocktailNarrativeProfile`:

- Perfil aromático / gustativo (reglas + ingredientes)
- Color (`inferLiquidTone`)
- Intensidad 1–5
- Personalidad, simbolismo, sensaciones
- 3–5 `narrativeHooks` únicos

## Persistencia

- Prisma: `CocktailNarrativeProfile`
- Snapshot: `data/cocktail_profiles.json`

## Relación 1:N

Un cóctel puede disparar múltiples historias. La coherencia se valida en QC (`lib/story-universe/qc/validate.ts`).

CLI: `npm run build:cocktail-profiles [--slug negroni] [--limit 10]`
