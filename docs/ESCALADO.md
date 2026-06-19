# Escalado y producción

Arquitectura objetivo para eltravieso: **Vercel** (Next.js) + **Render** (Bar Online WebSocket) + **Upstash Redis** + **Postgres con pooler** + **Sentry**.

## Diagrama

```mermaid
flowchart TB
  subgraph users [Usuarios]
    Browser[Browser]
  end

  subgraph vercel [Vercel]
    NextJS[Next.js App Router]
    API[API Routes]
  end

  subgraph render [Render]
    WS[Bar Online Socket.IO]
  end

  subgraph data [Datos]
    PG[(Postgres pooler)]
    Redis[(Upstash Redis)]
    Storage[Supabase Storage]
  end

  subgraph obs [Observabilidad]
    Sentry[Sentry]
  end

  Browser --> NextJS
  Browser --> WS
  NextJS --> API
  API --> PG
  API --> Redis
  WS --> Redis
  API --> Storage
  NextJS --> Sentry
  WS --> Sentry
  API --> Sentry
```

## Matriz de variables por servicio

| Variable | Vercel (Next.js) | Render (Bar Online) | Notas |
|----------|------------------|---------------------|-------|
| `DATABASE_URL` | Sí (pooler) | No | Transaction pooler, puerto 6543 en Supabase |
| `DIRECT_DATABASE_URL` | Migraciones CI | No | Conexión directa solo para `prisma migrate` |
| `NEXTAUTH_SECRET` | Sí | Sí | Mismo valor en ambos servicios |
| `NEXTAUTH_URL` | Sí | No | URL pública de la app |
| `NEXT_PUBLIC_APP_URL` | Sí | Sí | Origen CORS del socket |
| `NEXT_PUBLIC_WS_URL` | Sí | No | URL pública del servicio Render |
| `REDIS_URL` | Sí | Sí | Upstash `rediss://...` compartido |
| `WS_PORT` | No | Sí | Render inyecta `PORT`; mapear si hace falta |
| `SENTRY_DSN` | Sí | Sí | Mismo proyecto; tag `service` en WS |
| `SENTRY_ENVIRONMENT` | Sí | Sí | `production`, `preview`, etc. |
| Stripe / Holded / IA | Sí | No | Solo API Next.js |

## Postgres + Prisma en Vercel

En serverless, cada invocación puede abrir conexiones nuevas. Usa un **connection pooler**:

- **Supabase**: `DATABASE_URL` → Transaction mode (puerto **6543**)
- **Migraciones**: conexión directa separada

Cuando actives pooler en Supabase, actualiza `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

Hasta entonces, `DATABASE_URL` directo funciona en desarrollo y cargas bajas.

## Redis (Upstash)

`REDIS_URL` activa:

1. **Rate limit distribuido** — [`lib/rate-limit.ts`](../lib/rate-limit.ts) (`checkRateLimitAsync`)
2. **Bar Online multi-instancia** — adapter Socket.IO + presencia en [`server/realtime/index.ts`](../server/realtime/index.ts)

Sin Redis, rate limit y presencia quedan **en memoria por instancia** (incorrecto con varias réplicas).

### Crear instancia Upstash

1. [Upstash Console](https://console.upstash.com/) → Redis → Create
2. Copiar URL `rediss://default:...@....upstash.io:6379`
3. Pegar en Vercel y Render como `REDIS_URL`

Local con Docker: `docker compose up -d` → `REDIS_URL=redis://localhost:6379`

## Despliegue Vercel (Next.js)

1. Importar repo GitHub en [Vercel](https://vercel.com)
2. Framework: Next.js · Output: default
3. Variables de entorno (ver matriz arriba + campañas en [`CAMPANAS.md`](./CAMPANAS.md))
4. Build: el script `vercel-build` en `package.json` ejecuta migraciones antes del build:

```bash
npm run vercel-build
# equivale a: prisma migrate deploy && prisma generate && next build
```

   Vercel usa `vercel-build` automáticamente si existe; si no, configura Build Command manualmente como arriba.

5. Dominio custom → actualizar `NEXTAUTH_URL` y `NEXT_PUBLIC_APP_URL`

## Despliegue Render (Bar Online)

Blueprint: [`render.yaml`](../render.yaml) en la raíz del repo.

1. Dashboard Render → **New Blueprint** → conectar repo
2. Servicio `bar-online-realtime`:
   - Start: `npm run start:ws`
   - Health check: `/health`
3. Variables: `REDIS_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `SENTRY_DSN`, `SENTRY_ENVIRONMENT`
4. Copiar URL pública del servicio → `NEXT_PUBLIC_WS_URL` en **Vercel**

Ver [`docs/BAR-ONLINE.md`](./BAR-ONLINE.md) para desarrollo local (`npm run dev:ws`).

## Sentry

### Configuración en código

| Archivo | Rol |
|---------|-----|
| `instrumentation.ts` | Registro server/edge |
| `sentry.client.config.ts` | Cliente |
| `sentry.server.config.ts` | Server / API |
| `sentry.edge.config.ts` | Middleware `/admin` |
| `lib/sentry/init-realtime.ts` | Servidor Bar Online |

Errores centralizados en [`lib/security/safe-error.ts`](../lib/security/safe-error.ts) (`logServerError`). Guía operativa completa: [`docs/OBSERVABILIDAD.md`](./OBSERVABILIDAD.md).

### Alertas recomendadas

| Prioridad | Condición |
|-----------|-----------|
| P0 | Errores checkout / stripe-webhook > umbral |
| P1 | Pico `auth.login.failure` |
| P1 | Latencia P95 agente IA |
| P2 | Errores `bar-online-realtime` |

### Pasos en sentry.io

1. Crear proyecto **Next.js**
2. Copiar DSN → `SENTRY_DSN` y `NEXT_PUBLIC_SENTRY_DSN` (mismo valor)
3. Vercel: añadir env vars + `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` para source maps en CI
4. Render: mismo `SENTRY_DSN` + `SENTRY_ENVIRONMENT=production`

### Verificación

```bash
# Local (DSN de proyecto staging)
SENTRY_DSN=https://...@....ingest.sentry.io/... npm run dev

# Provocar error en checkout o agente IA y comprobar evento en Sentry Issues
```

Muestreo: `SENTRY_TRACES_SAMPLE_RATE` (default 0.1 prod, 1.0 dev) en [`lib/sentry/options.ts`](../lib/sentry/options.ts).

## Checklist pre-producción

- [ ] `DATABASE_URL` apunta al **pooler** (no conexión directa en runtime)
- [ ] `REDIS_URL` configurado en Vercel **y** Render
- [ ] `NEXT_PUBLIC_WS_URL` apunta al servicio Render desplegado
- [ ] `NEXTAUTH_SECRET` idéntico en Vercel y Render
- [ ] `SENTRY_DSN` activo; evento de prueba recibido
- [ ] Webhooks Stripe/Holded/TPV apuntan a dominio Vercel
- [ ] `npm run test` y `npm run build` pasan en CI

## Verificación local Redis + WS

```bash
docker compose up -d
export REDIS_URL=redis://localhost:6379

# Terminal 1
npm run dev

# Terminal 2
npm run dev:ws
```

Abrir `/bar-online` y comprobar presencia entre dos pestañas.

## Fase B (futuro)

- Cloudflare CDN delante de Vercel
- Colas para batch (`audit:recipes`, Remotion)
- Vercel AI Gateway para `/api/ai/agent`
- `directUrl` en Prisma cuando pooler Supabase esté activo
