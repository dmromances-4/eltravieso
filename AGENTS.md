# Guía para agentes (Cursor / Copilot)

## Agente de recetas (Barra Inteligente)

| Recurso | Ruta |
|--------|------|
| UI | `/pro/tech-generator` (Creador de Recetas) |
| API generar | `POST /api/ai/agent` — body: `{ "prompt": "..." }` (también `text`, `comment`) |
| API búsqueda | `GET /api/recipes/search?q=melocoton` |
| API estado | `GET /api/ai/status` o `GET /api/ai/agent` |

### Activar el agente

1. Copiar `.env.example` → `.env.local`
2. Configurar **al menos una** clave de texto (recomendado gratis):
   - `GEMINI_API_KEY` — https://aistudio.google.com/
   - `GROQ_API_KEY` — https://console.groq.com/
3. Opcional: `AI_PROVIDER=gemini|groq|openai|huggingface` o `AI_MOCK=true` para demo local
4. `npm run dev` y abrir http://localhost:3000/pro/tech-generator

### Comportamiento

- Busca recetas similares en `cocktails.json` + Prisma antes de generar.
- Siempre persiste en Prisma y aparece en `/recetas` (autor: usuario logueado o cuenta sistema).
- Devuelve estructura validada: título, ingredientes con medidas, instrucciones paso a paso y tipo de vaso.
- Repara ingredientes vacíos con una segunda llamada a la IA si hace falta.
- Proveedor y fallbacks: `lib/ai/provider.ts` (cadena gemini → groq → openai → huggingface).
- Disponibilidad: `lib/ai/availability.ts`.

## Guía de locales (mapa)

| Recurso | Ruta |
|--------|------|
| Mapa | `/mapa` |
| Ficha pública | `/locales/[slug]` |
| Scrape 50 Best | `npm run scrape:venues` → `data/venues-worlds50best.json` |
| Seed editorial | `npm run seed:venues` |
| Catálogo | `lib/venues/catalog.ts`, `lib/venues/reservation.ts` |
- Rate limit: `lib/rate-limit.ts` en `POST /api/ai/agent` (env `AI_RATE_LIMIT_*`).

### Archivos clave

- `app/api/ai/agent/route.ts`
- `app/pro/tech-generator/page.tsx`
- `lib/ai/provider.ts`
- `lib/ai/availability.ts`

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

- ESLint no se ignora en build (`next.config.mjs`)
- `loading.tsx` y `error.tsx` en rutas pesadas
- `app/not-found.tsx` para 404 global
- Stripe webhook valida firma con `STRIPE_WEBHOOK_SECRET`

Convenciones del monorepo: [`.github/copilot-instructions.md`](.github/copilot-instructions.md)

## Seguridad

### Rotación de claves (obligatorio si `.env.local` estuvo en git)

Rotar y actualizar en `.env.local` / Vercel:

- `NEXTAUTH_SECRET`
- `GEMINI_API_KEY`, `GROQ_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`, `HOLDED_API_KEY`

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
| `lib/auth/admin-api.ts` | Admin API con 2FA (`requireAdminUser`) |
