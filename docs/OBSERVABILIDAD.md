# Observabilidad y trazabilidad

Guía operativa para correlacionar errores, auditoría de seguridad y trazas entre Next.js (Vercel), Bar Online (Render) y Sentry.

## Componentes

| Capa | Módulo | Destino |
|------|--------|---------|
| Correlation ID | [`middleware.ts`](../middleware.ts) | Header `x-request-id` en todas las respuestas |
| Logs JSON | [`lib/observability/logger.ts`](../lib/observability/logger.ts) | stdout → Vercel / Render logs |
| Errores | [`lib/security/safe-error.ts`](../lib/security/safe-error.ts) | Sentry + log JSON |
| Auditoría | [`lib/observability/audit.ts`](../lib/observability/audit.ts) | Postgres `AuditLog` + log JSON + breadcrumb Sentry |
| Trazas | [`lib/observability/sentry-span.ts`](../lib/observability/sentry-span.ts) | Sentry Performance |
| WS | [`server/realtime/index.ts`](../server/realtime/index.ts) | Sentry tag `service: bar-online-realtime` |

## Buscar un incidente por `requestId`

1. Copia el header `x-request-id` de la respuesta HTTP o del `<meta name="x-request-id">` en el HTML.
2. En **Sentry**, filtra: `requestId:<uuid>`.
3. En **Vercel/Render logs**, busca la misma cadena en líneas JSON.
4. En **Postgres**:

```sql
SELECT * FROM "AuditLog"
WHERE "requestId" = '...'
ORDER BY "createdAt" DESC;
```

## Eventos de auditoría principales

| Acción | Cuándo |
|--------|--------|
| `auth.login.success` / `auth.login.failure` | NextAuth credentials |
| `auth.2fa.failure` | Código TOTP inválido |
| `auth.register` | `POST /api/auth/register` |
| `auth.password.change` | `POST /api/user/password` |
| `checkout.session.created` | Checkout Stripe creado |
| `checkout.completed` | Webhook Stripe confirma pedido |
| `webhook.stripe.received` | Entrada webhook Stripe |
| `webhook.holded.received` | Entrada webhook Holded |
| `webhook.tpv.received` | Entrada webhook TPV |
| `rate_limit.exceeded` | Respuesta 429 |
| `admin.product.update` | Ejemplo mutación admin |
| `bar_online.room.join` | Join sala (log WS) |

Retención recomendada: **90 días** para `AuditLog` (limpieza manual o job programado).

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Errores y traces |
| `SENTRY_ENVIRONMENT` | Tag entorno |
| `SENTRY_TRACES_SAMPLE_RATE` | Muestreo traces (default 0.1 prod) |
| `SENTRY_PROFILES_SAMPLE_RATE` | Profiling opcional |
| `SENTRY_AUTH_TOKEN` | Source maps en CI |

## Alertas Sentry recomendadas

Configurar en [sentry.io](https://sentry.io) (no en código):

| Prioridad | Condición |
|-----------|-----------|
| P0 | Errores `scope:checkout` o `scope:stripe-webhook` > 5 en 15 min |
| P1 | Pico de `auth.login.failure` > 20 en 10 min |
| P1 | P95 span `ai-agent.create_recipe` > 30 s |
| P2 | Errores `service:bar-online-realtime` |

Cron monitors: habilitados vía `automaticVercelMonitors` en [`next.config.mjs`](../next.config.mjs).

## Bar Online ↔ Next.js

El cliente envía `sentry-trace`, `baggage` y `x-request-id` en el handshake Socket.IO ([`lib/realtime/useBarOnline.ts`](../lib/realtime/useBarOnline.ts)). El servidor WS continúa la traza con `Sentry.continueTrace()`.

## Verificación local

```bash
npm run db:setup   # aplica migración AuditLog
SENTRY_DSN=... npm run dev
npm run dev:ws     # segunda terminal
npm run test
```

Provocar login fallido → fila en `AuditLog` + log JSON en terminal.

### Troubleshooting: Vitest / Rollup en otra plataforma

Vitest usa Rollup con binarios nativos por OS (`@rollup/rollup-darwin-*` vs `@rollup/rollup-linux-*`). Si `node_modules` se instaló en macOS y ejecutas tests en Linux (sandbox Cursor, Docker, CI), verás un error de binario ausente.

```bash
# Mensaje claro vía pretest
npm run test   # falla con instrucciones si falta el binario

# Solución en Linux / CI / agentes
npm run test:ci

# Solución manual
rm -rf node_modules && npm ci && npm run test
```

CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) ejecuta `npm ci` en `ubuntu-latest` antes de lint y test.

## Extender auditoría admin

Tras mutaciones en rutas `app/api/admin/**`:

```typescript
const admin = await requireAdminUser();
void auditAdminAction(admin, "admin.recipe.update", {
  request,
  resourceType: "Recipe",
  resourceId: params.id,
});
```

Ver también [`docs/ESCALADO.md`](./ESCALADO.md) y [`docs/SECRETOS.md`](./SECRETOS.md).
