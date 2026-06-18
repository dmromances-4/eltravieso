# Norma de IDs en fichas

Convención canónica para recetas, productos y locales en El Travieso. Evita duplicados en listados y en el contenido de cada ficha.

## Recetas

| Campo | Convención |
|-------|------------|
| **Clave canónica** | `slug` (único en URL) |
| **ID visible** | `dg-*` (Difford's) o `slug-{slug}` / `db-{uuid}` en catálogo |
| **URL** | `/recetas/{slug}` |
| **Fuente editorial** | `data/cocktails.json` gana sobre filas Prisma con el mismo slug |

El catálogo público (`lib/recipes/catalog.ts`) prioriza entradas estáticas. Las filas Prisma con slug ya presente en JSON no se listan, pero pueden conservarse para autoría o vídeo.

**Auditoría:** `npm run audit:recipe-duplicates` → `data/audits/recipe-duplicates.json`

**Merge:** `npm run merge:recipe-duplicates -- --dry-run`

## Productos

| Campo | Convención |
|-------|------------|
| **Clave canónica** | `slug` + `productCode` |
| **ID visible** | `ET-PROD-00001` (5 dígitos) |
| **URL** | `/shop/{slug}` |
| **Enciclopedia** | Vinculada vía `encyclopediaSlug` (no fusionar tablas) |

Los stubs `ingrediente-*` del seed demo no deben mostrarse si existe un producto real con el mismo término de match.

**Backfill códigos:** `npm run backfill:product-codes`

**Vincular enciclopedia:** `npm run link:products-encyclopedia -- --dry-run`

**Auditoría:** `npm run audit:product-duplicates` → `data/audits/product-duplicates.json`

## Locales

| Campo | Convención |
|-------|------------|
| **Clave canónica** | `sourceUrl` (seed 50 Best) + `venueCode` |
| **ID visible** | `ET-LOC-00001` |
| **URL** | `/locales/{slug}` |
| **Mapa** | Un pin por local: si un guide tiene `barProfileId` con bar público en mapa, solo se muestra el pin affiliate |

**Backfill códigos:** `npm run backfill:venue-codes`

**Geocodificar:** `npm run geocode:venues -- --only-missing`

**Auditoría:** `npm run audit:venue-duplicates` → `data/audits/venue-duplicates.json`

## Scripts de diagnóstico

```bash
npm run audit:recipe-duplicates
npm run audit:product-duplicates
npm run audit:venue-duplicates
npm run check:local   # incluye conteo de pins y smoke APIs del mapa
```

## Reglas de ficha (sin repetir datos)

- **Receta:** ID canónico una vez en meta/Intel; ingredientes en sidebar o bloque compra, no ambos con el mismo texto.
- **Producto:** ficha técnica (ABV, volumen, SKU, `productCode`) + bloque enciclopedia enlazado en lectura.
- **Local:** `dressCode` solo en Preferencias **o** Intel; `venueCode` + `sourceUrl` en footer Intel.
