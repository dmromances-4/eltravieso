# Panel de administración

Área restringida bajo `/admin`. Requiere usuario con rol **ADMIN**; por defecto también **2FA activo**.

### Desactivar 2FA admin (temporal)

En `.env.local` o Vercel:

```bash
ADMIN_REQUIRE_2FA=false
```

Reinicia el servidor. Solo rol ADMIN + sesión válida; sin redirect a `/setup-2fa`. Política en `lib/auth/admin-2fa-policy.ts`. **No usar en producción real** — reactivar con `ADMIN_REQUIRE_2FA=true`.

## Acceso

- Layout: `app/admin/layout.tsx`
- Evaluación: `lib/auth/admin-access.ts` (`evaluateAdminAccess`)
- API admin: `lib/auth/admin-api.ts` (`requireAdminUser`)

Si el acceso falla, redirige a login o configuración 2FA según `adminAccessRedirect`.

## Secciones

| Sección | Ruta | Notas |
|---------|------|-------|
| Dashboard | `/admin` | Resumen |
| Productos | `/admin/products` | Catálogo B2C |
| Marketplace | `/admin/marketplace` | Listings pendientes |
| Mayorista | `/admin/wholesale` | Pedidos B2B |
| Producción | `/admin/production` | Lotes de producción |
| Recetas | `/admin/recipes` | CRUD editorial |
| Auditoría Difford's | `/admin/recetas-auditoria` | Ver [AUDITORIA-RECETAS.md](./AUDITORIA-RECETAS.md) |
| Blog | `/admin/posts` | Entradas |
| Campañas | `/admin/campaigns` | Email / SMS / WhatsApp — ver [CAMPANAS.md](./CAMPANAS.md) |
| Reparto | `/admin/delivery` | Rutas de entrega |
| Fiscal | `/admin/tax-registry` | Registro fiscal |
| Foro | `/admin/forum` | Moderación |

## API admin de ejemplo

- `app/api/admin/recipes-audit/` — auditoría de recetas
- Otras rutas bajo `app/api/admin/` siguen el mismo patrón de auth

## Seguridad

- No exponer datos sensibles en respuestas de error en producción (`lib/security/safe-error.ts`).
- Enmascarar tokens en logs/API (`lib/security/redact.ts`).

Ver [AGENTS.md — Panel admin](../AGENTS.md#panel-admin).
