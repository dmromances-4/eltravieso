# Guía para agentes (Cursor / Copilot)

## Desarrollo local

| Opción | Comando | Notas |
|--------|---------|-------|
| Docker | `docker compose up -d` | Postgres `:5432`, Redis `:6379` |
| Embedded Postgres | `npm run db:local` | Sin Docker; puerto `5433` |
| Migraciones + demo | `npm run db:setup` | `migrate deploy` + seeds |

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

```bash
npm run test          # Vitest (unitarios + E2E si SMOKE_BASE_URL está definido)
npm run smoke         # Requiere dev server en localhost:3000
npm run lint          # ESLint activo en build
npm run build
```

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
