# Guía de locales (mapa)

Mapa interactivo y fichas SEO de bares y restaurantes destacados (World's 50 Best + afiliados).

## Rutas públicas

| Ruta | Descripción |
|------|-------------|
| `/mapa` | Globo 3D MapLibre (fallback Leaflet 2D) con filtros y clustering |
| `/locales/[slug]` | Ficha pública del local |

> **Nota i18n:** el segmento `/locales/` en la URL es la **ficha del local** (venue), no el idioma. El idioma va en el prefijo opcional: `/en/mapa`, `/en/locales/[slug]`. Español por defecto sin prefijo (`/mapa`). Ver [`docs/GUIA-I18N.md`](GUIA-I18N.md).

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

```bash
# 1. Scrape editorial desde theworlds50best.com
npm run scrape:venues
# Informe de cobertura de campos:
npm run scrape:venues -- --report
# → data/venues-worlds50best.json

# 2. Importar a Prisma (VenueGuideEntry)
npm run seed:venues
npm run backfill:venue-codes

# 3. Geocodificar direcciones (Nominatim, query compuesta + confidence)
npm run geocode:venues -- --limit 50
# Solo faltantes o baja confianza:
npm run geocode:venues -- --only-missing
npm run geocode:venues -- --retry-low-confidence

# 4. Sugerencias TripAdvisor (CSV de revisión manual)
npm run enrich:tripadvisor -- --suggest
# → data/tripadvisor-suggestions.csv

# 5. Importar CSV curado (TripAdvisor + IDs externos)
npm run enrich:tripadvisor -- --import data/tripadvisor-curated.csv
```

Opcional al seed: `SEED_VENUES_GEOCODE=true` para geocodificar durante el import.

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
slug,tripadvisorUrl,rating,address,tripadvisorPlaceId,googleBusinessId,priceLevel,cuisineLabels,amenities
sips,https://www.tripadvisor.es/...,4.5,,d12345678,ChIJ...,2,japanese|spanish,wheelchair_accessible|vegan_options
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

- TripAdvisor: `lib/venues/enrich-taxonomy-mapper.ts` + columnas opcionales en CSV import (`priceLevel`, `cuisineLabels`, `amenities` separados por `|`)
- Google Places: stub `lib/venues/enrich-google-places.ts` (`GOOGLE_PLACES_API_KEY`)

```csv
slug,tripadvisorUrl,rating,address,tripadvisorPlaceId,googleBusinessId,priceLevel,cuisineLabels,amenities
sips,https://www.tripadvisor.es/...,4.5,,d12345678,ChIJ...,2,japanese|spanish,wheelchair_accessible|vegan_options
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
- `lib/venues/reservation.ts` — enlaces de reserva
- `lib/geocoding/nominatim.ts` — geocodificación
- `components/map/MapaPageClient.tsx`, `VenueMapShell.tsx`, `VenueGlobeMap.tsx`
- `components/venues/VenueHero.tsx`, `VenueLoreBlocks.tsx`, `VenueDetailBlocks.tsx`
- `lib/venues/taxonomy.ts`, `venue-detail-fields.ts`, `enrich-taxonomy-mapper.ts`

## Atribución

El contenido editorial scrapeado de [World's 50 Best](https://www.theworlds50best.com/) se atribuye en cada ficha pública.

Ver [AGENTS.md — Guía de locales](../AGENTS.md#guía-de-locales-mapa).
