# Guía de internacionalización (i18n)

El Travieso usa **next-intl** con rutas bajo `app/[locale]/`.

## Idiomas

| Locale | URL | Notas |
|--------|-----|-------|
| `es` (default) | `/recetas`, `/shop`, … | Sin prefijo (`localePrefix: 'as-needed'`) |
| `en` | `/en/recetas`, `/en/shop`, … | Prefijo `/en` |

## Confusión habitual: `/locales/` ≠ idioma

- **`/[locale]/locales/[slug]`** — ficha pública de un **local** (bar/restaurante).
- El segmento **`locales`** es el nombre de la ruta de venues, no el código de idioma.

Ejemplos:

- Español: `/locales/dry-mill`
- Inglés: `/en/locales/dry-mill`

## Archivos clave

| Recurso | Ruta |
|---------|------|
| Routing | `i18n/routing.ts`, `middleware.ts` |
| Navegación locale-aware | `i18n/navigation.ts` (`Link`, `useRouter`, `usePathname`) |
| Mensajes UI | `messages/es.json`, `messages/en.json` |
| Errores API | `lib/i18n/errors.ts`, `lib/i18n/api.ts` |
| Contenido editorial EN | `data/i18n/en/*.json` (sidecars) |
| Traducción batch | `npm run translate:content -- --locale en --source cocktails` |
| Stub EN cocktails | `npm run seed:en-cocktails` |

## Usuario

- `User.preferredLocale` en Prisma (default `es`).
- `PATCH /api/user/locale` actualiza preferencia.
- Campañas email usan `preferredLocale` para el pie legal.

## SEO

`alternates.languages` en metadata de recetas, shop, biblioteca, mapa y blog.

## App móvil

Capacitor carga la misma web; el idioma sigue la URL o la preferencia guardada. Ver `docs/APP-MOVIL.md`.
