# Reglas de generación de historias

## Orden obligatorio

1. `ingest:literary-corpus`
2. `build:knowledge-base`
3. `build:cocktail-profiles`
4. `generate:stories` (piloto `--limit 20` antes del batch)

## Flags CLI

```bash
npm run generate:stories -- --limit 20 --discover-only
npm run generate:stories -- --slug negroni --category bars
npm run generate:stories -- --target-total 2000 --no-ai  # mock local
```

## QC automático

- Originalidad (Jaccard vs loglines existentes)
- Coherencia cóctel ↔ emoción
- Potencial animación (`animationPotential` ≥ 0.55)
- Hasta 3 reintentos por historia

Env: `STORY_MIN_ORIGINALITY_SCORE=0.85`

## Progreso

`data/.story-generation-progress.json` — reanudable con `--force` para regenerar.
