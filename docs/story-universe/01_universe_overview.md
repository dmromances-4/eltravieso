# Universo narrativo El Travieso

Motor escalable de historias originales vinculadas al catálogo de cócteles (`data/cocktails.json`), con pipeline hacia guiones, storyboards y animación cartoon.

## Reglas legales

- Los EPUB en `corpus/epubs/` son **solo entrada de análisis temático**.
- **No** se persiste prosa protegida en `knowledge_base/`.
- **No** se generan adaptaciones literales ni citas largas.
- El output son patrones abstractos (temas, arquetipos, emociones) e historias **100% originales**.

## Fases

| Fase | Comando | Salida |
|------|---------|--------|
| 1 | `npm run ingest:literary-corpus` | `knowledge_base/raw_extractions/` |
| 2–3 | `npm run build:knowledge-base` | `knowledge_base/*.json` |
| 4 | `npm run build:cocktail-profiles` | Prisma + `data/cocktail_profiles.json` |
| 5 | `npm run generate:stories` | Prisma `Story` |
| 6 | `npm run generate:scripts` | Prisma `StoryScript` |
| 7 | `npm run generate:storyboards` | Prisma `StoryStoryboard` |
| 8 | `npm run generate:animation-prompts` | Prisma `StoryAnimationPrompt` |
| 9 | `npm run export:story-universe` | `data/exports/cocktail_universe.json` |

**Importante:** completar fases 1–4 antes de generación masiva de historias.

## Meta de contenido

- 2000+ historias (cuotas en `knowledge_base/generation_quotas.json`)
- 1 cóctel → N historias
- Episodios animados objetivo: 10–18 min

Ver también: [02_narrative_system.md](./02_narrative_system.md), [06_animation_pipeline.md](./06_animation_pipeline.md).
