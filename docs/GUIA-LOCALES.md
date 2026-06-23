# Guía de locales (mapa)

Mapa interactivo y fichas SEO de bares y restaurantes destacados (World's 50 Best + afiliados).

## Rutas públicas

| Ruta | Descripción |
|------|-------------|
| `/mapa` | Globo 3D MapLibre (fallback Leaflet 2D) con filtros, búsqueda client-side y clustering |
| `/locales/[slug]` | Ficha pública del local |

> **Nota i18n:** el segmento `/locales/` en la URL es la **ficha del local** (venue), no el idioma. El idioma va en el prefijo opcional: `/en/mapa`, `/en/locales/[slug]`. Español por defecto sin prefijo (`/mapa`). Ver [`docs/GUIA-I18N.md`](GUIA-I18N.md).

**Índice en `/mapa`:** orden editorial BARS → RESTAURANTS, luego rank global World's 50 Best y nombre; la búsqueda filtra lista y pins del mapa en el cliente.

## Cuenta de bar (afiliados)

- `/cuenta/bar` — lore, horarios, reservas y **planes de mapa** (Featured / Booking Plus)
- API guía: `GET /api/venues/guide`
- Checkout plan mapa: `POST /api/billing/map-plan` (Stripe subscription)
- Portal facturación: `POST /api/billing/portal`

### Planes de mapa (SaaS bares)

| Plan | Beneficio |
|------|-----------|
| `FREE` | Ficha pública si `isPublicOnMap=true` |
| `FEATURED` | Pin destacado, badge "Top del Barrio", prioridad en listados |
| `BOOKING_PLUS` | Widget de reservas embebido (`bookingWidgetEnabled`) |

Variables Stripe: `STRIPE_MAP_FEATURED_PRICE_ID`, `STRIPE_MAP_BOOKING_PRICE_ID`.

Admin puede forzar plan: `PATCH /api/admin/bars/[id]/map-plan`.

## Pipeline de datos

**Orden recomendado:** consolidar BD existente **antes** de scrapear locales nuevos. El scrape de World's 50 Best solo añade/actualiza entradas en JSON por `sourceUrl`; no rellena `venuePreferences`.

### Requisitos previos (Windows)

| Paso | Comando | Notas |
|------|---------|-------|
| Base de datos | `docker compose up -d postgres` **o** `npm run db:local` | Sin BD: `Can't reach database server at localhost:5433` |
| `DATABASE_URL` | `.env.local` | Docker → puerto **5432**; embedded → **5433** |
| Migraciones | `npx prisma migrate deploy` | Tras primera vez con BD nueva |
| UTF-8 | Docker (recomendado en Windows) | Embedded Postgres antiguo puede usar `WIN1252` y fallar con locales asiáticos |

Si `seed:venues` omite locales con error `WIN1252` / `22P05`: borra `.localpg/` y reinicia `npm run db:local`, o cambia a Docker en puerto 5432.

`enrich:google` requiere `GOOGLE_PLACES_API_KEY` en `.env.local` (Places API **New**; no usar ADC/`setup_adc.sh`).

Variables opcionales: `GOOGLE_PLACES_RATE_MS` (default 200), `GOOGLE_PLACES_AUTO_MIN_SCORE` (default 0.88), `GOOGLE_ENRICH_LIMIT`.

### Fase 1 — Auditoría y códigos (sin scrape)

```bash
npm run check:local
npm run audit:venue-duplicates
# → data/audits/venue-duplicates.json
# → data/audits/venue-profile-completeness.json

npm run backfill:venue-codes   # ET-LOC-* donde falte
```

### Unificación canónica (duplicados global + regional)

El mismo local puede aparecer en listas GLOBAL y REGIONAL con `sourceUrl` distintos. Unificar **antes** de scrapear de nuevo:

```bash
npm run unify:venues -- --dry-run   # informe sin escribir
npm run unify:venues                # JSON + BD; fusiona por nombre+ciudad+categoría
# → data/audits/venue-canonical-merge.json
npm run seed:venues
npm run audit:venue-duplicates      # logicalDuplicates debe ser 0
```

Criterio: **1 local físico = 1 ficha** (~300–350 entradas tras unificar ~600 sourceUrls). Los slugs absorbidos redirigen vía `lib/venues/slug-redirects.ts`.

### Migración de slugs (sufijos numéricos malformados)

Si el JSON tiene slugs malformados (`maido-restaurant-restaurant`, `coa-bar-bar`) por listas globales + regionales:

```bash
npm run fix:venue-slugs -- --dry-run   # informe sin escribir
npm run fix:venue-slugs                # JSON + BD por sourceUrl
# → data/audits/venue-slug-migration.json
```

Recalcula slugs desde `sourceUrl` + categoría y asigna sufijos numéricos (`-2`, `-3`) en colisión. **Las URLs `/locales/[slug]` cambian** en los afectados; el informe lista `oldSlug → newSlug`.

Tras la migración: `npm run seed:venues` (debe dar 600 upserts, 0 omitidos).

### Fase 2 — Geocodificar y sincronizar JSON → BD

```bash
# Geocodificar direcciones (Nominatim, ~1,1 s/request; cientos de locales ≈ 10–15 min)
npm run geocode:venues
npm run geocode:venues -- --only-missing
npm run geocode:venues -- --retry-low-confidence
GEOCODE_LIMIT=50 npm run geocode:venues   # prueba con límite

# Importar JSON a Prisma (merge seguro: no pisa taxonomía TripAdvisor ni venueCode)
npm run seed:venues
npm run audit:venue-duplicates
```

**Regla anti-pérdida:** `seed:venues` fusiona con el registro Prisma existente (`mergeVenueGuides` + `mergeVenueGuideDetailFields`). Arrays vacíos del JSON **no** sobrescriben `venuePreferences`, `cuisineTypes`, etc. ya importados.

Opcional al seed: `SEED_VENUES_GEOCODE=true` para geocodificar durante el import.

### Fase 3 — Preferencias y taxonomía (TripAdvisor)

1. Generar sugerencias de búsqueda (ya enlazadas por `slug`):

```bash
npm run enrich:tripadvisor -- --suggest
# → data/tripadvisor-suggestions.csv
```

2. Curar manualmente: copia filas verificadas a `data/tripadvisor-curated.csv` (plantilla en `data/tripadvisor-curated.csv.example`).

3. Importar preferencias y taxonomía:

```bash
npm run enrich:tripadvisor -- --import data/tripadvisor-curated.csv
npm run audit:venue-duplicates
```

Sin CSV curado, `venuePreferences` no se rellenan de forma masiva (el scrape W50Best no las incluye).

### Fase 3b — Google Places (opcional)

Requiere `GOOGLE_PLACES_API_KEY` en `.env.local` con **Places API (New)** activada en Google Cloud. No uses ADC ni `setup_adc.sh` — el proyecto autentica con API key (`X-Goog-Api-Key`). **Nunca commitees la clave** (solo en `.env.local`, gitignored).

```bash
# Prueba de conexión
npm run enrich:google -- --dry-run --limit=5

# Sugerencias para revisión manual
npm run enrich:google -- --suggest
# → data/google-places-suggestions.csv
# Copia filas verificadas a data/google-places-curated.csv (slug,googleBusinessId)

# Importar IDs curados + enriquecer taxonomía/ubicación/web
npm run enrich:google -- --import data/google-places-curated.csv

# Auto-asignación solo alta confianza (score >= GOOGLE_PLACES_AUTO_MIN_SCORE)
npm run enrich:google -- --discover --auto --dry-run --limit=50
npm run enrich:google -- --discover --auto

# Rellenar huecos en locales que ya tienen Place ID
npm run enrich:google -- --only-missing
```

Campos que rellena (solo si faltan): `googleBusinessId`, `address`, coords, `externalWebsite`, `neighborhood`, `priceRange`, `establishmentTypes`, `venuePreferences`, `venueFeatures`. No pisa `photoUrl`, `history`, `verdict` ni taxonomía TripAdvisor existente.

**Sin Google Places API:** usa heurísticas editoriales + CSV TripAdvisor (manual o `--taxonomy-only`).

#### Enriquecimiento automático desde texto W50 (sin API)

```bash
npm run enrich:editorial -- --dry-run
npm run enrich:editorial
npm run enrich:editorial -- --limit=50
```

Módulo: `lib/venues/enrich-editorial-heuristics.ts`. Deriva `cuisineTypes`, `idealFor`, `venueFeatures`, `starDishes` y `awards` desde `history`/`verdict`. También se aplica al scrape vía `enrichGuideFromScrape`.

#### Plantilla CSV TripAdvisor asistida

```bash
npm run prepare:tripadvisor-curated -- --limit=25 --europe
# → data/tripadvisor-curated.csv (rellena tripadvisorUrl manualmente)

# Solo taxonomía/preferencias (sin URL TripAdvisor aún):
npm run enrich:tripadvisor -- --import data/tripadvisor-curated.csv --taxonomy-only
```

### Fase 4 — Scrape para locales nuevos (usuario, al final)

Solo cuando `audit:venue-duplicates` muestre 0 duplicados críticos de `sourceUrl` / `ET-LOC`:

```bash
npm run scrape:venues
npm run scrape:venues -- --report
npm run seed:venues
npm run backfill:venue-codes
npm run geocode:venues
npm run audit:venue-duplicates
# → data/venues-worlds50best.json
```

### Checklist de ficha completa (`VenueGuideEntry`)

| Bloque | Campos | Fuente típica |
|--------|--------|----------------|
| Identidad | `venueCode`, `slug`, `name`, `sourceUrl` | `backfill:venue-codes`, scrape |
| Ubicación | `address`, `city`, `country`, `latitude`, `longitude`, `geocodeConfidence` | scrape + `geocode:venues` |
| Editorial | `photoUrl`, `history` o `verdict`, `chefName`, `externalWebsite` | scrape `--detail-only` |
| Ranking | `worlds50bestRank`, `continent`, `additionalRankings` | scrape |
| Taxonomía | `establishmentTypes`, `cuisineTypes`, `idealFor`, `venueFeatures`, `priceRange` | TripAdvisor CSV / manual |
| Preferencias | `venuePreferences[]` | TripAdvisor `amenities` → `enrich-taxonomy-mapper.ts` |
| Enlaces | `tripadvisorUrl`, `instagramUrl`, `tiktokUrl` | CSV / cuenta bar |

Informe: `data/audits/venue-profile-completeness.json` (gaps por slug).

## Identificadores de catálogo

Cada local tiene un **código interno** único (`ET-LOC-00001`) y, opcionalmente, IDs de plataformas externas:

| Campo | Dónde | Formato |
|-------|--------|---------|
| `venueCode` | Ficha `/locales/[slug]` + cuenta bar | `ET-LOC-00001` |
| `googleBusinessId` | Cuenta bar + guía editorial | Place ID `ChIJ…` o ID numérico GMB |
| `tripadvisorPlaceId` | Cuenta bar + guía editorial | `d12345678` (o URL al importar CSV) |

Validadores: `lib/venues/external-ids.ts`.

```bash
# Asignar códigos a locales existentes sin código
npm run backfill:venue-codes

# Importar TripAdvisor + IDs externos (CSV curado)
npm run enrich:tripadvisor -- --import data/tripadvisor-curated.csv
```

Plantilla CSV import:

```csv
slug,tripadvisorUrl,rating,address,tripadvisorPlaceId,googleBusinessId,priceLevel,cuisineLabels,amenities,features,awards
sips,https://www.tripadvisor.es/...,4.5,,d12345678,ChIJ...,2,japanese|spanish,wheelchair_accessible|vegan_options,outdoor_seating|romantic,michelin
```

Los afiliados editan Google y TripAdvisor en `/cuenta/bar`. El código `ET-LOC-*` se asigna automáticamente al guardar.

## Campos editoriales y preferencias

Taxonomía centralizada en `lib/venues/taxonomy.ts`. Persistencia en `BarProfile` (afiliados) y `VenueGuideEntry` (editorial).

| Bloque | Campos Prisma |
|--------|----------------|
| Identidad y gastronomía | `establishmentTypes[]`, `cuisineTypes[]`, `starDishes[]` (máx. 5) |
| Ambiente y ubicación | `idealFor[]`, `venueFeatures[]`, `neighborhood` |
| Precios | `priceRange` (`under_15`, `range_15_30`, `range_30_50`, `over_50`), `dailyMenuEnabled`, `dailyMenuNote`, `awards[]` |
| Preferencias | `venuePreferences[]` (dietas, accesibilidad, mascotas, niños, instalaciones incl. `dress_code`, pagos, eventos) + texto `dressCode` |
| Links | `instagramUrl`, `tiktokUrl`, `tripadvisorUrl`, `theForkUrl` |

UI: edición en `/cuenta/bar` (`VenueDetailFieldsSection`), ficha pública `VenueDetailBlocks` en `/locales/[slug]`.

Enriquecimiento futuro:

- TripAdvisor: `lib/venues/enrich-taxonomy-mapper.ts` + columnas opcionales en CSV import (`priceLevel`, `cuisineLabels`, `amenities`, `features`, `awards` separados por `|`)
- Heurísticas editoriales: `lib/venues/enrich-editorial-heuristics.ts` + `npm run enrich:editorial`
- Google Places: `lib/venues/enrich-google-places.ts` + `lib/venues/google-place-match.ts` + `npm run enrich:google` (`--suggest`, `--import`, `--discover --auto`, `--only-missing`)
- Unificación legacy ↔ taxonomía: `lib/venues/venue-profile-sync.ts` (venueType → establishmentTypes, vibeTags → idealFor/features, dressCode → dress_code)

```csv
slug,tripadvisorUrl,rating,address,tripadvisorPlaceId,googleBusinessId,priceLevel,cuisineLabels,amenities,features,awards
sips,https://www.tripadvisor.es/...,4.5,,d12345678,ChIJ...,2,japanese|spanish,wheelchair_accessible|vegan_options,outdoor_seating|romantic,michelin
```

## Mapa 3D (MapLibre)

Por defecto `/mapa` carga un **globo 3D** con MapLibre GL (open source). Sin clave API usa [OpenFreeMap](https://openfreemap.org/) (estilo vectorial). Con `NEXT_PUBLIC_MAPTILER_API_KEY` se habilita estilo satélite/híbrido y terreno DEM opcional (`NEXT_PUBLIC_MAP_TERRAIN_URL`).

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_MAPLIBRE_STYLE_URL` | Estilo base (calles) |
| `NEXT_PUBLIC_MAPTILER_API_KEY` | Satélite/híbrido + terreno (opcional) |
| `NEXT_PUBLIC_MAP_TERRAIN_URL` | URL DEM personalizada (opcional) |

UX del globo:

- Capas: Red El Travieso / Destacados 50 Best · filtro por continente
- Clustering de pins al alejar · panel lateral al seleccionar local
- `flyTo` al cambiar continente o pin · geolocalización opcional
- Toggle **2D plano** (MapLibre) o fallback **Leaflet** si WebGL no está disponible
- `prefers-reduced-motion`: animaciones de cámara desactivadas
- Deep link `/mapa?slug=nombre-local` desde la ficha del local
- Toggle «Solo ubicaciones fiables» (oculta geocodificación de baja confianza)

### Checklist post-scrape (`--report`)

Tras `npm run scrape:venues`, el informe debe mostrar aproximadamente:

| Campo | Umbral mínimo |
|-------|----------------|
| `history` o `verdict` | ≥ 80% con valor |
| `externalWebsite` | ≥ 50% |
| `address` | ≥ 95% |
| `photoUrl` | 100% |

Si `history`/`verdict` siguen en 0%, el parser necesita ajuste o hay que vaciar `.scrape-cache/w50best/` y re-scrapear.

Componentes: `VenueMapShell.tsx` (orquestador), `VenueGlobeMap.tsx`, `VenueMapLeaflet.tsx` (fallback), `useVenueMapData.ts`.

## Archivos clave

- `lib/venues/catalog.ts` — lectura y filtros del catálogo
- `lib/venues/merge-guide.ts`, `guide-from-db.ts` — merge seguro JSON ↔ BD
- `lib/venues/canonical-venue.ts` — unificación por identidad (nombre+ciudad+categoría)
- `lib/venues/slug-redirects.ts` — redirects de slugs absorbidos
- `scripts/unify-venues.ts` — pipeline de dedup canónico
- `lib/venues/reservation.ts` — enlaces de reserva
- `lib/geocoding/nominatim.ts` — geocodificación
- `components/map/MapaPageClient.tsx`, `VenueMapShell.tsx`, `VenueGlobeMap.tsx`
- `components/venues/VenueHero.tsx`, `VenueLoreBlocks.tsx`, `VenueDetailBlocks.tsx`
- `lib/venues/taxonomy.ts`, `venue-detail-fields.ts`, `enrich-taxonomy-mapper.ts`

## Atribución

El contenido editorial scrapeado de [World's 50 Best](https://www.theworlds50best.com/) se atribuye en cada ficha pública.

Ver [AGENTS.md — Guía de locales](../AGENTS.md#guía-de-locales-mapa).
