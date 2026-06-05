# Guía de locales (mapa)

Mapa interactivo y fichas SEO de bares y restaurantes destacados (World's 50 Best + afiliados).

## Rutas públicas

| Ruta | Descripción |
|------|-------------|
| `/mapa` | Mapa Leaflet con filtros |
| `/locales/[slug]` | Ficha pública del local |

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
# → data/venues-worlds50best.json

# 2. Importar a Prisma (VenueGuideEntry)
npm run seed:venues

# 3. Geocodificar direcciones (Nominatim)
npm run geocode:venues

# 4. Sugerencias TripAdvisor (CSV de revisión manual)
npm run enrich:tripadvisor -- --suggest
# → data/tripadvisor-suggestions.csv
```

Opcional al seed: `SEED_VENUES_GEOCODE=true` para geocodificar durante el import.

## Archivos clave

- `lib/venues/catalog.ts` — lectura y filtros del catálogo
- `lib/venues/reservation.ts` — enlaces de reserva
- `lib/geocoding/nominatim.ts` — geocodificación
- `components/map/MapaPageClient.tsx`, `VenueMap.tsx`
- `components/venues/VenueHero.tsx`, `VenueLoreBlocks.tsx`

## Atribución

El contenido editorial scrapeado de [World's 50 Best](https://www.theworlds50best.com/) se atribuye en cada ficha pública.

Ver [AGENTS.md — Guía de locales](../AGENTS.md#guía-de-locales-mapa).
