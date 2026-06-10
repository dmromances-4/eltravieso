# Pantalla — catálogo audiovisual

Hub editorial en `/pantalla`: películas, series, podcasts, eventos de bares y directos.

## Rutas

| Recurso | Ubicación |
|---------|-----------|
| Hub público | `/pantalla` |
| Ficha | `/pantalla/[slug]` |
| Directo | `/pantalla/directo` |
| Admin | `/admin/pantalla`, `/admin/pantalla/directo`, `/admin/pantalla/feeds` |
| Eventos bar | `/cuenta/bar/eventos` |

## Modelos Prisma

- `MediaItem` — películas, series, episodios, podcasts, eventos
- `PodcastFeed` — RSS auto-sync
- `LiveStream` — embeds en directo (golf, deportes…)
- `MediaComment` / `MediaRating` — social

## CLI

```bash
npm run import:tmdb -- --tv 1399
npm run import:tmdb -- --movie 550 --publish
npm run sync:podcast-feeds
# Cron (Vercel): GET /api/cron/sync-podcasts + Authorization: Bearer $CRON_SECRET
```

## Variables

- `TMDB_API_KEY` — import metadatos TMDB
- `SUPABASE_EVENT_VIDEOS_BUCKET` — MP4 eventos
- `SUPABASE_MEDIA_COVERS_BUCKET` — portadas

## Catálogo privado y legal

- `playbackUrl`: URL de reproducción pegada por admin (HLS/MP4/iframe). Sin cliente BitTorrent.
- Directos: fuentes embed curadas manualmente en `/admin/pantalla/directo`.
- Metadatos TMDB bajo sus términos; enlaces externos responsabilidad del operador (DMCA).

## Tests

```bash
npm run test -- tests/media-player.test.ts tests/media-validate.test.ts tests/media-rss.test.ts tests/media-tmdb.test.ts tests/media-comments.test.ts
```
