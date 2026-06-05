# Auditoría de recetas (Difford's Guide)

Compara el catálogo local `data/cocktails.json` con [Difford's Guide](https://www.diffordsguide.com/) para detectar divergencias en ingredientes, método y metadatos.

## Rutas y archivos

| Recurso | Ubicación |
|---------|-----------|
| Panel admin | `/admin/recetas-auditoria` |
| Detalle | `/admin/recetas-auditoria/[id]` |
| API | `app/api/admin/recipes-audit/` |
| CLI | `scripts/audit-recipes.ts` |
| Fetch remoto | `lib/diffords/fetch-recipe.ts`, `parse-recipe-page.ts` |
| Comparación | `lib/recipes/compare-recipes.ts` |
| Conversión | `lib/recipes/diffords-to-travieso.ts` |
| I/O JSON | `lib/recipes/cocktails-io.ts` |

## CLI

```bash
# Rellenar diffordId y sourceUrl desde CSV
npm run audit:recipes:backfill

# Auditar las primeras N recetas sin escribir
npm run audit:recipes -- --limit 5 --dry-run

# Solo pendientes; auto-aplicar si score ≥ 95
npm run audit:recipes -- --from pending --auto-apply-threshold 95
```

Estados de revisión (`reviewStatus`): `pending` | `ok` | `fixed` | `manual`.

## Acceso respetuoso al scrape

- `robots.txt` de Difford's permite `/cocktails/recipe/*`
- Throttle: 2 s entre peticiones (`RATE_MS` en fetch)
- Caché local: `.scrape-cache/diffords/`

## Tests

```bash
npm run test -- tests/compare-recipes.test.ts tests/diffords-parser.test.ts tests/diffords-to-travieso.test.ts
```

Ver también [AGENTS.md — Auditoría](../AGENTS.md#auditoría-de-recetas-diffords-guide).
