# Gestión de secretos y claves API

Guía central para variables de entorno en eltravieso. Plantilla: [`.env.example`](../.env.example). Valores reales: **solo** en `.env.local` (local) o en el panel de Vercel/Render (producción).

## Flujo recomendado

1. `cp .env.example .env.local`
2. Rellenar claves según la matriz de abajo.
3. `npm run check:env` — auditoría con pings enmascarados.
4. `npm run check:local` — BD, migraciones, Bar Online + resumen de features.
5. Nunca commitear `.env`, `.env.local` ni variantes (pre-commit en [`scripts/check-secrets.sh`](../scripts/check-secrets.sh)).

Cursor ignora `.env.local` vía [`.cursorignore`](../.cursorignore) para reducir exposición en chat.

## Comandos de verificación

| Comando | Qué comprueba |
|---------|----------------|
| `npm run check:env` | Todas las claves agrupadas (core, IA, portadas, integraciones) |
| `npm run check:env -- --scope=covers` | Solo Pexels, Unsplash, Gemini portadas |
| `npm run check:env -- --scope=ai` | Proveedores IA texto + imagen |
| `npm run check:recipe-covers` | Alias enfocado en portadas (delega en el mismo módulo) |
| `npm run check:local` | Infra local + flags `recipeCoversStock`, `aiText`, etc. |

## Matriz capacidad ↔ clave

| Capacidad | Variables mínimas | Alta / docs |
|-----------|-------------------|-------------|
| App + auth | `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` | [`AGENTS.md`](../AGENTS.md) |
| Agente IA texto | Al menos una: `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`, `HUGGINGFACE_API_KEY` | [Gemini](https://aistudio.google.com/) · [Groq](https://console.groq.com/) |
| Portadas stock gratis | `PEXELS_API_KEY` y/o `UNSPLASH_ACCESS_KEY` | [Pexels API](https://www.pexels.com/api/) · [Unsplash](https://unsplash.com/developers) |
| Portadas IA (opcional) | `GEMINI_API_KEY` + visión; Imagen suele requerir plan de pago | [`PORTADAS-RECETAS.md`](./PORTADAS-RECETAS.md) |
| Demo sin APIs | `AI_MOCK=true` | SVG de marca, sin red |
| Pantalla TMDB | `TMDB_API_KEY` | [TMDB](https://www.themoviedb.org/settings/api) |
| Subida media | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase Storage REST |
| Checkout / VIP | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs | Stripe Dashboard |
| Campañas email | `RESEND_API_KEY`, `MARKETING_*` | `npm run check:marketing-prod` |
| Bar Online multi-instancia | `REDIS_URL` | [`ESCALADO.md`](./ESCALADO.md) |
| Mapa 3D satélite/terreno | `NEXT_PUBLIC_MAPTILER_API_KEY` (opcional; calles gratis sin clave) | [MapTiler](https://www.maptiler.com/cloud/) |

## Tabla por variable (`.env.example`)

| Variable | Módulo | Local | Prod |
|----------|--------|-------|------|
| `DATABASE_URL` | Prisma | Obligatorio | Obligatorio (pooler en Vercel) |
| `NEXTAUTH_SECRET` | Auth | Obligatorio | Obligatorio |
| `GEMINI_API_KEY` | IA + portadas | Recomendado | Recomendado |
| `GROQ_API_KEY` | IA fallback | Opcional | Opcional |
| `PEXELS_API_KEY` | Portadas stock | Recomendado | Recomendado |
| `UNSPLASH_ACCESS_KEY` | Portadas stock | Opcional | Opcional |
| `TMDB_API_KEY` | Pantalla | Opcional | Si usas `/pantalla` |
| `STRIPE_*` | Pagos | Opcional | Si checkout activo |
| `SUPABASE_*` | Storage | Opcional | Recomendado prod |
| `NEXT_PUBLIC_MAPTILER_API_KEY` | Mapa 3D satélite | Opcional | Opcional |
| `HOLDED_API_KEY` | Integraciones | Opcional | Por bar |
| `SENTRY_*` | Observabilidad | Opcional | Recomendado prod |

Lista completa y comentarios: [`.env.example`](../.env.example).

## Formato de claves Google AI

Las claves de [Google AI Studio](https://aistudio.google.com/) pueden empezar por `AIza…` o `AQ.…`. Ambos formatos son válidos si la API responde 200 en `npm run check:env`.

## Rotación obligatoria

Rota y actualiza en `.env.local` y Vercel si la clave estuvo en:

- Un mensaje de chat (Cursor, Slack, etc.)
- Un commit git (aunque luego se eliminara del historial)
- Un issue o PR público

Prioridad alta:

- `NEXTAUTH_SECRET`
- `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`, `HOLDED_API_KEY`
- `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`

## Pre-commit anti-secretos

```bash
chmod +x scripts/check-secrets.sh
git config core.hooksPath .githooks
mkdir -p .githooks
ln -sf ../scripts/check-secrets.sh .githooks/pre-commit
```

Bloquea `.env*` (excepto `.env.example`) y patrones obvios (`AIza…`, `AQ.…`, `gsk_…`, `sk_live_…`, etc.) en el diff staged.

## Producción

- **Vercel:** Project Settings → Environment Variables (Production + Preview).
- **Render:** Bar Online WS — ver [`ESCALADO.md`](./ESCALADO.md).
- Tras cambiar secretos: redeploy.
- Checklist marketing: `npm run check:marketing-prod`.

## Enmascarado en logs

Los scripts de check muestran solo los últimos 4 caracteres de cada clave (`********abcd`). Helpers: [`lib/security/redact.ts`](../lib/security/redact.ts), [`lib/env/mask-env-key.ts`](../lib/env/mask-env-key.ts).

## Portadas: estado típico en free tier

| Capa Gemini | Free tier habitual |
|-------------|-------------------|
| Auth + listado modelos | OK |
| Texto (`gemini-2.5-flash`) | OK |
| Imagen (`imagen-4.0-fast-generate-001`) | Suele exigir plan de pago |
| `gemini-2.5-flash-image` | Cuota 0 en muchas cuentas free |

**Recomendación:** configurar `PEXELS_API_KEY` para el pipeline 100% gratuito documentado en [`PORTADAS-RECETAS.md`](./PORTADAS-RECETAS.md).
