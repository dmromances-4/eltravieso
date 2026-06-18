# Almacenamiento de vídeo — guía económica

## Decisión recomendada (híbrida)

| Capa | Proveedor | Contenido |
|------|-----------|-----------|
| Base de datos | Supabase Postgres | URLs, metadatos, `Recipe.videoUrl`, `MediaItem.playbackUrl` |
| Imágenes pequeñas | Supabase Storage | portadas, avatares, fichas |
| **Vídeo público** | **Cloudflare R2** + CDN | recetas, episodios universo, Pantalla |

**Por qué R2:** egress **$0**; ~$0,015/GB/mes almacenamiento. Supabase cobra egress (~$0,09/GB) — caro con muchas reproducciones.

Alternativa más barata en disco: Backblaze B2 + Cloudflare CDN (Bandwidth Alliance).

## Coste orientativo mensual

| Escenario | Supabase vídeo | Cloudflare R2 |
|-----------|----------------|---------------|
| Piloto (25 GB, 200 GB tráfico) | ~$43 | ~$0,40 |
| Medio (350 GB, 2 TB tráfico) | ~$195 | ~$5 |
| Grande (3 TB, 20 TB tráfico) | $1.800+ | ~$45 |

## Buckets R2 propuestos

| Bucket | Contenido |
|--------|-----------|
| `eltravieso-recipe-videos` | MP4 recetas 9:16 |
| `eltravieso-story-episodes` | Episodios universo 10–18 min |
| `eltravieso-media` | Películas, eventos Pantalla |

## Variables de entorno

```env
# supabase (default) | r2
STORAGE_PROVIDER=r2

# Cloudflare R2 (S3-compatible)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_URL=https://cdn.tudominio.com
R2_REGION=auto
R2_RECIPE_VIDEOS_BUCKET=eltravieso-recipe-videos
R2_STORY_EPISODES_BUCKET=eltravieso-story-episodes
R2_MEDIA_BUCKET=eltravieso-media
```

Sin R2 configurado: fallback Supabase → `public/uploads/` en local.

## Subida de películas grandes

No usar la API Next.js para archivos >100 MB. Opciones:

1. **CLI:** `aws s3 cp pelicula.mp4 s3://eltravieso-media/films/ --endpoint-url https://<account>.r2.cloudflarestorage.com`
2. **rclone** con remote R2
3. Pegar `playbackUrl` externa en Pantalla (YouTube, Vimeo) para terceros

## Código

- Driver: [`lib/storage/object-storage.ts`](../lib/storage/object-storage.ts)
- Upload recetas: [`lib/storage/upload-image.ts`](../lib/storage/upload-image.ts)
- Render CLI: `npm run render:recipe-videos`, `npm run render:story-episodes`

## Setup R2 (30–45 min)

1. Cloudflare Dashboard → R2 → Create bucket
2. Manage R2 API Tokens → Object Read & Write
3. Conectar dominio custom (`cdn.eltravieso.bar`) al bucket
4. Pegar variables en `.env.local` y Vercel
