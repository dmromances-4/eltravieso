# Schema roadmap — modelos y superficies UI

Decisión: **implementar superficies mínimas** en lugar de podar el schema. Los modelos `ForumTopic`, `DeliveryRoute` y `LiquorsTaxRegistry` forman parte del roadmap B2B/comunidad.

## Implementado

| Modelo | Superficie |
|--------|------------|
| `ForumTopic` / `ForumComment` | `/comunidad` — listado, detalle, crear tema y comentarios (auth) |
| `ForumTopic` moderación | `/admin/forum` + `PATCH /api/admin/forum/topics/[id]` — pin, cerrar, archivar |
| `DeliveryRoute` / `DeliveryStop` | `/admin/delivery` — CRUD rutas y asignación de pedidos wholesale |
| `LiquorsTaxRegistry` | `/admin/tax-registry` — listado + formulario de alta |
| Integraciones catálogo | Holded/Square/Shopify sync → `Product` + `BarStock` |
| `BarProfile` lore + slug | `/locales/[slug]` — afiliados con `isPublicOnMap` |
| `VenueGuideEntry` | Import editorial World's 50 Best — `/locales/[slug]`, `/mapa` capa destacados |
| `MarketingConsent` | Opt-in GDPR por canal — registro `/register`, audiencia campañas |
| `Campaign` / `CampaignMessage` | Campañas admin — `/admin/campaigns`, envío Resend/Twilio |
| `MediaItem` / `PodcastFeed` / `LiveStream` | Pantalla — `/pantalla`, import TMDB, RSS podcasts, directo, eventos bar |
| `MediaComment` / `MediaRating` | Comentarios y valoraciones en fichas Pantalla |

## Próximos pasos (no bloqueantes)

- OAuth Square / Holded (sustituir tokens manuales)
- Webhooks nativos Holded (API v2, previsto 2026) — endpoint propio ya listo
- Cron reconciliación Shopify
- Edición/eliminación de comentarios del foro
- ~~Rate limit IA con Redis en producción multi-instancia~~ → activar `REDIS_URL` (ver [`docs/ESCALADO.md`](./ESCALADO.md); código listo en `lib/rate-limit.ts`)
