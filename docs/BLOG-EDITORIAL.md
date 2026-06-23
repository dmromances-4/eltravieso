# Blog editorial — voces gastronómicas hispanas

Hub en `/blog` con tres apartados: **Escrito**, **Vídeo** y **Podcast**. Catálogo de autores editoriales externos, ingesta syndicated desde 2026 con atribución al origen.

## Arquitectura

| Apartado | Almacenamiento | Ingesta |
|----------|----------------|---------|
| Escrito | `BlogPost` + `editorialAuthorId` | RSS → extracto 2–3 párrafos |
| Vídeo | `EditorialCuratedItem` (VIDEO) | YouTube channel RSS → embed |
| Podcast | `EditorialCuratedItem` (PODCAST) | Podcast RSS → audio/enlace |

**No usa `MediaItem` / Pantalla** — el blog editorial es un módulo aislado para no acoplar al admin de `/pantalla`.

## Archivos clave

| Recurso | Ruta |
|---------|------|
| Catálogo JSON | `data/gastronomic-writers.json` |
| Seed autores | `npm run seed:blog-authors` |
| Sync contenido | `npm run sync:blog-syndication` |
| Lógica ingesta | `lib/blog/syndication.ts` |
| Hub público | `/blog`, `/blog/autores`, `/blog/video/[slug]`, `/blog/podcast/[slug]` |

## Comandos

```bash
# 1. Migración (si no aplicada)
npx prisma migrate deploy

# 2. Cargar perfiles editoriales
npm run seed:blog-authors

# 3. Importar contenido desde 2026
npm run sync:blog-syndication -- --kind all --since 2026-01-01 --dry-run
npm run sync:blog-syndication -- --kind written --limit 5
npm run sync:blog-syndication -- --kind podcast --writer maxi-guerra
```

Flags: `--kind written|video|podcast|all`, `--writer slug`, `--since YYYY-MM-DD`, `--limit N`, `--dry-run`, `--force-fetch`.

## Política de atribución

- **Escrito:** solo extracto editorial; canonical y CTA al artículo original.
- **Vídeo:** iframe YouTube + enlace al vídeo original.
- **Podcast:** reproductor o enlace al episodio original.
- Respeta `robots.txt` (`lib/scrape/robots.ts`) y throttle `RATE_MS` (2s).

## Añadir un autor

1. Editar `data/gastronomic-writers.json` (slug único, bio, feeds).
2. `npm run seed:blog-authors`
3. `npm run sync:blog-syndication -- --writer nuevo-slug`

## Límites de no-regresión

**No modificar** en este módulo:

- `lib/media/*`, `MediaItem`, `PodcastFeed`, `/pantalla/*`
- Contrato de `app/api/blog/*` y `PostEditor` (posts de usuario)
- `components/map/*`, `lib/venues/*` (trabajo paralelo)

## Tests

```bash
npm run test -- tests/blog-syndication.test.ts tests/blog-sections.test.ts
```
