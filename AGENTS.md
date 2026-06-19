# eltravieso — Guía para agentes (Cursor / Copilot)

## Desarrollo local

| Opción | Comando | Notas |
|--------|---------|-------|
| Docker | `docker compose up -d` | Postgres `:5432`, Redis `:6379` |
| Embedded Postgres | `npm run db:local` | Sin Docker; puerto `5433` |
| Migraciones + demo | `npm run db:setup` | `migrate deploy` + seeds |
| Diagnóstico | `npm run check:local` | BD, migraciones, WS, URLs auth |

**Checklist local**

1. Copiar `.env.example` → `.env.local` y elegir perfil `DATABASE_URL` (5432 Docker o 5433 embedded).
2. Usar **siempre** `http://localhost:3000` en `NEXTAUTH_URL` y `NEXT_PUBLIC_APP_URL` (no `127.0.0.1`).
3. `npm run check:local` — corregir avisos antes de probar features.
4. `npm run dev` +, para Bar Online, `npm run dev:ws` en otra terminal.
5. Banner amarillo en dev si falta BD/WS/migraciones.

Paleta y componentes UI: [`docs/DISENO-MARCA.md`](docs/DISENO-MARCA.md).

Copiar `.env.example` → `.env.local`. Auth = **NextAuth** (Prisma adapter, sesiones en BD, 2FA opcional). **No** uses Supabase Auth ni `@supabase/ssr`; Supabase aquí es solo Storage REST para imágenes/vídeos (`lib/storage/`).

Admin sin 2FA temporal: `ADMIN_REQUIRE_2FA=false` en `.env.local` (ver [`docs/ADMIN.md`](docs/ADMIN.md)).

### Documentación y reglas Cursor

| Recurso | Ruta |
|--------|------|
| Índice docs | [`docs/README.md`](docs/README.md) |
| Convenciones repo | [`.github/copilot-instructions.md`](.github/copilot-instructions.md) |
| Reglas Cursor | [`.cursor/rules/`](.cursor/rules/) (7 reglas por módulo) |

## Agente de recetas (Barra Inteligente)

| Recurso | Ruta |
|--------|------|
| UI | `/pro/tech-generator` (Creador de Recetas) |
| API generar | `POST /api/ai/agent` — body: `{ "prompt": "..." }` (también `text`, `comment`) |
| API búsqueda | `GET /api/recipes/search?q=melocoton` |
| API estado | `GET /api/ai/status` o `GET /api/ai/agent` |

### Activar el agente

1. Configurar **al menos una** clave de texto (recomendado gratis):
   - `GEMINI_API_KEY` — https://aistudio.google.com/
   - `GROQ_API_KEY` — https://console.groq.com/
2. Opcional: `AI_PROVIDER=gemini|groq|openai|huggingface` o `AI_MOCK=true` para demo local
3. `npm run dev` y abrir http://localhost:3000/pro/tech-generator

### Comportamiento

- Busca recetas similares en `cocktails.json` + Prisma antes de generar.
- Siempre persiste en Prisma y aparece en `/recetas` (autor: usuario logueado o cuenta sistema).
- Devuelve estructura validada: título, ingredientes con medidas, instrucciones paso a paso y tipo de vaso.
- Repara ingredientes vacíos con una segunda llamada a la IA si hace falta.
- Proveedor y fallbacks: `lib/ai/provider.ts` (cadena gemini → groq → openai → huggingface).
- Disponibilidad: `lib/ai/availability.ts`.
- Rate limit: `lib/rate-limit.ts` en `POST /api/ai/agent` (env `AI_RATE_LIMIT_*`).

### Archivos clave

- `app/api/ai/agent/route.ts`
- `app/pro/tech-generator/page.tsx`
- `lib/ai/provider.ts`
- `lib/ai/availability.ts`

## Auditoría de recetas (Difford's Guide)

Compara `data/cocktails.json` con la fuente [Difford's Guide](https://www.diffordsguide.com/) receta por receta.

```bash
npm run audit:recipes:backfill              # IDs + sourceUrl desde CSV
npm run audit:recipes -- --limit 5 --dry-run
npm run audit:recipes -- --from pending --auto-apply-threshold 95
npm run dev                                 # /admin/recetas-auditoria
```

| Recurso | Ruta |
|--------|------|
| Panel admin | `/admin/recetas-auditoria` |
| CLI | `scripts/audit-recipes.ts` |
| Fetch/parser | `lib/diffords/` |
| Comparación | `lib/recipes/compare-recipes.ts` |

Acceso respetuoso: `robots.txt` permite `/cocktails/recipe/*`, throttle 2s (`RATE_MS`), caché en `.scrape-cache/diffords/`.

Doc detallada: [`docs/AUDITORIA-RECETAS.md`](docs/AUDITORIA-RECETAS.md)

## Portadas de recetas

Pipeline **100% gratuito** para fotografías editoriales: stock Pexels/Unsplash, referencia Difford's + Gemini (visión + Imagen 3).

```bash
npm run generate:recipe-images -- --discover-only --limit 10
npm run generate:recipe-images -- --limit 5 --slug negroni
npm run generate:recipe-images -- --import-cover ./photo.jpg --slug negroni
```

| Recurso | Ruta |
|--------|------|
| CLI | `scripts/generate-recipe-images.ts` |
| Orquestador | `lib/recipes/generate-recipe-image.ts` |
| Descubrimiento | `lib/recipes/cover-discovery.ts` |
| IA gratuita | `lib/ai/provider.ts` (`generateFreeImage`) |
| Regenerar (usuario) | `POST /api/user/recipes/:id/image` |

Doc detallada: [`docs/PORTADAS-RECETAS.md`](docs/PORTADAS-RECETAS.md)

## Vídeos de recetas (Remotion + cartoon clásico)

Vídeos tutorial 9:16 con timeline por beats, mascota Travieso y estilo cartoon 60s–80s (sin copiar IP de referencia).

```bash
npm run render:recipe-videos -- --discover-only --slug negroni
npm run render:recipe-videos -- --limit 5 --require-cover
npm run render:recipe-videos -- --polish --discover-only --slug sweet-martini
```

| Recurso | Ruta |
|--------|------|
| Guía cartoon + integración | `docs/GUIA-REFERENCIA-ANIMACION.md` (§5) |
| Pipeline operativo | `docs/VIDEOS-RECETAS.md` |
| Composición Remotion | `remotion/recipe-tutorial/` |
| CLI | `scripts/render-recipe-videos.ts` |
| Mascota (poses SVG) | `public/brand/travieso/` |
| Prompts cartoon | `lib/animation/classic-cartoon-prompts.ts` |
| Timeline + beats | `lib/recipes/video-timeline.ts` |

Requiere portada generada antes del render (`generate:recipe-images`). Ver [`docs/GUIA-REFERENCIA-ANIMACION.md`](docs/GUIA-REFERENCIA-ANIMACION.md).

## Story Universe Engine

Universo narrativo escalable: historias originales por cóctel → guiones 10–18 min → storyboard → prompts cartoon → Remotion.

```bash
npm run ingest:literary-corpus -- --limit 5
npm run build:knowledge-base
npm run build:cocktail-profiles
npm run generate:stories -- --limit 20
npm run generate:scripts -- --limit 5
npm run export:story-universe
```

| Recurso | Ruta |
|--------|------|
| Índice docs | [`docs/story-universe/01_universe_overview.md`](docs/story-universe/01_universe_overview.md) |
| Knowledge | `knowledge_base/` |
| Módulos | `lib/story-universe/` |
| Remotion episodios | `remotion/story-episode/` |
| Prisma | `Story`, `StoryScript`, `CocktailNarrativeProfile`, … |

**Fases 1–4 antes de historias.** EPUBs en `corpus/epubs/` (no commitear).

## Fichas editoriales (Figma + Notion)

Exportación y publicación de fichas user-friendly desde `cocktails.json`.

```bash
npm run export:cocktails-fichas              # ok/fixed → data/exports/
npm run export:cocktails-fichas -- --limit 20 --format notion
```

| Recurso | Ruta |
|--------|------|
| Catálogo | `data/cocktails.json` |
| Export CLI | `scripts/export-cocktail-fichas.ts` |
| Ficha web | `/recetas/[slug]` |

Doc detallada: [`docs/FICHAS-COCTEL.md`](docs/FICHAS-COCTEL.md)

## Biblioteca (libros de referencia)

Catálogo editorial de libros de coctelería — clásicos, técnica, editoriales e historia — con fichas, filtros y enlace opcional a Shop o afiliado.

| Recurso | Ruta |
|--------|------|
| Listado | `/biblioteca` |
| Ficha | `/biblioteca/[slug]` |
| Datos | `data/books.json` |
| Catálogo | `lib/books/catalog.ts` |

Cross-links: recetas con `cocktailSlugs` en el JSON muestran bloque «También en Biblioteca» en `/recetas/[slug]`.

## Guía de locales (mapa)

| Recurso | Ruta |
|--------|------|
| Mapa | `/mapa` |
| Ficha pública | `/locales/[slug]` |
| Scrape 50 Best | `npm run scrape:venues` → `data/venues-worlds50best.json` |
| Seed editorial | `npm run seed:venues` |
| Geocodificar | `npm run geocode:venues` |
| Enriquecer TripAdvisor | `npm run enrich:tripadvisor -- --suggest` |
| Catálogo | `lib/venues/catalog.ts`, `lib/venues/reservation.ts` |

Doc detallada: [`docs/GUIA-LOCALES.md`](docs/GUIA-LOCALES.md)

## Monetización Canalla

Tres líneas de ingreso en paralelo (mapa SaaS, membresía VIP, comisión marketplace).

| Pilar | UI / API | Stripe |
|--------|----------|--------|
| Mapa SaaS (bares) | `/cuenta/bar` · `POST /api/billing/map-plan` | `STRIPE_MAP_FEATURED_PRICE_ID`, `STRIPE_MAP_BOOKING_PRICE_ID` |
| Club VIP (~15€/mes) | `/cuenta/membresia` · `POST /api/billing/vip` | `STRIPE_VIP_PRICE_ID` |
| Split marketplace | `GET /api/marketplace/sales` · ledger `OrderSplitLine` | Connect fase 2 |

Env adicional: `MARKETPLACE_DEFAULT_COMMISSION_BPS`, `VIP_MAX_ROOM_USERS`, `FREE_MAX_ROOM_USERS`.

- Checkout B2C: crea `Order` PENDING + split lines; webhook confirma y decrementa stock.
- Marketplace en carrito exige login.
- VIP: `membershipStatus` en User; `isVip` en sesión JWT; salas privadas Bar Online.

## Bar Online (realtime)

Salas de chat/videollamada/cata entre bares. Servidor Socket.IO **independiente** de Next.js.

| Recurso | Ruta / comando |
|--------|----------------|
| UI lobby | `/bar-online` |
| Sala | `/bar-online/[roomId]` |
| API sesiones | `GET/POST /api/bar-online` |
| Servidor WS | `npm run dev:ws` (puerto `WS_PORT`, default 3001) |
| Cliente hook | `lib/realtime/useBarOnline.ts` |
| Servidor | `server/realtime/index.ts` |

Variables: `NEXT_PUBLIC_WS_URL`, `WS_PORT`, `REDIS_URL` (opcional; sin Redis = presencia en memoria, instancia única).

Health check HTTP: `GET /health` (Render) o `GET /` en local.

Doc detallada: [`docs/BAR-ONLINE.md`](docs/BAR-ONLINE.md) · producción: [`docs/ESCALADO.md`](docs/ESCALADO.md)

## Panel admin

Rutas bajo `/admin` (rol ADMIN; 2FA obligatorio salvo `ADMIN_REQUIRE_2FA=false`). Navegación en `app/admin/layout.tsx`.

| Sección | Ruta |
|---------|------|
| Dashboard | `/admin` |
| Productos | `/admin/products` |
| Marketplace | `/admin/marketplace` |
| Mayorista | `/admin/wholesale` |
| Producción | `/admin/production` |
| Recetas | `/admin/recipes` |
| Auditoría Difford's | `/admin/recetas-auditoria` |
| Blog | `/admin/posts` |
| Campañas | `/admin/campaigns` |
| Reparto | `/admin/delivery` |
| Fiscal | `/admin/tax-registry` |
| Foro | `/admin/forum` |

API admin protegida: `lib/auth/admin-api.ts` (`requireAdminUser`).

Doc detallada: [`docs/ADMIN.md`](docs/ADMIN.md)

## Campañas marketing

Email / SMS / WhatsApp desde admin con consentimiento GDPR.

```bash
# Variables: RESEND_API_KEY, TWILIO_*, MARKETING_FROM_EMAIL, MARKETING_UNSUBSCRIBE_SECRET
```

| Recurso | Ruta |
|--------|------|
| Panel | `/admin/campaigns` |
| API | `/api/admin/campaigns` |
| Baja email | `/api/marketing/unsubscribe?token=…` |

Doc detallada: [`docs/CAMPANAS.md`](docs/CAMPANAS.md)

## Pantalla (media hub)

Series, películas (TMDB), podcasts (RSS), eventos de bar y directos curados por admin.

```bash
npm run import:tmdb -- --tv 1399 --seasons all   # CLI import serie
npm run sync:podcast-feeds                       # Sincronizar feeds RSS
```

| Recurso | Ruta |
|--------|------|
| Hub público | `/pantalla` |
| Ficha | `/pantalla/[slug]` |
| En directo | `/pantalla/directo` |
| Admin catálogo | `/admin/pantalla` |
| Admin directo | `/admin/pantalla/directo` |
| Feeds RSS | `/admin/pantalla/feeds` |
| Eventos bar | `/cuenta/bar/eventos` |

Variables: `TMDB_API_KEY`, `SUPABASE_EVENT_VIDEOS_BUCKET`, `SUPABASE_MEDIA_BUCKET`.

Doc detallada: [`docs/PANTALLA.md`](docs/PANTALLA.md)

## Integraciones (TPV / Shopify / Holded / Square)

| Recurso | Ruta |
|--------|------|
| UI | `/cuenta/integraciones` |
| Shopify sync | `POST /api/integrations/shopify/sync` |
| Holded sync | `POST /api/integrations/holded/sync` |
| Holded webhook | `POST /api/integrations/holded/webhook` (entrada + push stock salida vía TPV) |
| Square sync | `POST /api/integrations/square/sync` |
| TPV webhook | `POST /api/tpv/webhook` |
| Estado | `GET /api/user/integrations` |

Documentación completa: [`docs/INTEGRACIONES.md`](docs/INTEGRACIONES.md).

Variables mínimas: `HOLDED_API_KEY`, `SHOPIFY_CLIENT_ID`/`SHOPIFY_CLIENT_SECRET`, `SQUARE_ENVIRONMENT`, `STRIPE_WEBHOOK_SECRET`.

## Calidad y verificación

Catálogo unificado (productos, recetas, locales): `npm run sync:catalog` — ver [`docs/MEMORIA-CODIGO.md`](docs/MEMORIA-CODIGO.md).

```bash
npm run test          # Vitest (unitarios + E2E si SMOKE_BASE_URL está definido)
npm run smoke         # Requiere dev server en localhost:3000
npm run lint          # ESLint activo en build
npm run build
```

**Dependencias nativas (Rollup/Vitest):** instala siempre en la misma plataforma donde ejecutas tests. Si `node_modules` viene de macOS y corres tests en Linux (sandbox Cursor, CI), Vitest fallará por binarios nativos ausentes.

```bash
# macOS (desarrollo local)
npm ci && npm run test

# Linux (sandbox, agentes remotos, CI)
npm run test:ci
```

CI en GitHub Actions: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (`ubuntu-latest`, `npm ci`, lint + test).

E2E opcional: `SMOKE_BASE_URL=http://localhost:3000 npm run test`

## Producción

Stack: **Vercel** (Next.js) + **Render** (Bar Online WS) + **Upstash Redis** + **Sentry**. Guía completa: [`docs/ESCALADO.md`](docs/ESCALADO.md).

- ESLint no se ignora en build (`next.config.mjs`)
- `loading.tsx` y `error.tsx` en rutas pesadas
- `app/not-found.tsx` para 404 global
- Stripe webhook valida firma con `STRIPE_WEBHOOK_SECRET`
- Observabilidad: `@sentry/nextjs` + `logServerError` en [`lib/security/safe-error.ts`](lib/security/safe-error.ts)
- Bar Online: desplegar [`server/realtime/index.ts`](server/realtime/index.ts) en Render (`render.yaml`); **`REDIS_URL` obligatorio** con varias instancias
- Postgres en Vercel: usar URL del **pooler** (ver `docs/ESCALADO.md`)

## Seguridad

### Rotación de claves (obligatorio si `.env.local` estuvo en git)

Guía completa: [`docs/SECRETOS.md`](docs/SECRETOS.md). Verificación: `npm run check:env`.

Rotar y actualizar en `.env.local` / Vercel:

- `NEXTAUTH_SECRET`
- `GEMINI_API_KEY`, `GROQ_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`, `HOLDED_API_KEY`
- `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (CI / source maps)

### Pre-commit anti-secretos

```bash
chmod +x scripts/check-secrets.sh
git config core.hooksPath .githooks
mkdir -p .githooks
ln -sf ../scripts/check-secrets.sh .githooks/pre-commit
```

### Helpers

| Módulo | Uso |
|--------|-----|
| `lib/security/redact.ts` | Enmascarar tokens en API |
| `lib/security/safe-error.ts` | Errores genéricos en producción |
| `lib/checkout/validate-cart.ts` | Precios checkout desde Prisma |
| `lib/rate-limit.ts` | Rate limits (Redis opcional vía `REDIS_URL`) |
| `lib/auth/admin-api.ts` | Admin API (`requireAdminUser`; 2FA según `ADMIN_REQUIRE_2FA`) |
