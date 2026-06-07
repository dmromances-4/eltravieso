# Vermut El Travieso

Plataforma B2C/B2B de vermut: tienda, recetas con agente IA, comunidad, Bar Online, guía de locales y panel admin.

## Requisitos

- Node.js 18+
- PostgreSQL (Docker, embedded Postgres o remoto)
- Redis opcional (Bar Online multi-instancia, rate limit distribuido)

## Setup rápido

```bash
cp .env.example .env.local
# Edita DATABASE_URL, NEXTAUTH_SECRET y al menos una clave IA (GEMINI_API_KEY o GROQ_API_KEY)

docker compose up -d   # opcional: Postgres + Redis
npm install
npm run db:setup     # migrate + seed demo
npm run dev
npm run dev:ws       # opcional: Bar Online en :3001
```

Abre http://localhost:3000

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor Next.js |
| `npm run dev:ws` | Socket.IO Bar Online (puerto 3001) |
| `npm run build` | Build producción (Prisma generate + Next.js) |
| `npm run vercel-build` | Build Vercel con `prisma migrate deploy` |
| `npm run test` | Tests Vitest |
| `npm run smoke` | Smoke de rutas (requiere `npm run dev`) |
| `npm run lint` | ESLint |
| `npm run db:local` | Postgres embebido sin Docker (puerto 5433) |
| `npm run db:setup` | Migrate + seeds demo |
| `npm run scrape:venues` | Scrape World's 50 Best |
| `npm run seed:venues` | Importa venues a Prisma |
| `npm run geocode:venues` | Geocodifica direcciones (Nominatim) |
| `npm run audit:recipes` | Auditoría recetas vs Difford's |
| `npm run audit:recipes:backfill` | IDs Difford's desde CSV |

E2E con servidor activo:

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run test
```

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [AGENTS.md](AGENTS.md) | Guía principal para agentes IA |
| [docs/README.md](docs/README.md) | Índice de documentación |
| [docs/INTEGRACIONES.md](docs/INTEGRACIONES.md) | Shopify, Holded, Square, TPV |
| [docs/AUDITORIA-RECETAS.md](docs/AUDITORIA-RECETAS.md) | Auditoría Difford's |
| [docs/BAR-ONLINE.md](docs/BAR-ONLINE.md) | Realtime Socket.IO |
| [docs/GUIA-LOCALES.md](docs/GUIA-LOCALES.md) | Mapa y fichas de locales |
| [docs/ADMIN.md](docs/ADMIN.md) | Panel de administración |
| [docs/ESCALADO.md](docs/ESCALADO.md) | Producción: Vercel, Render, Redis, Sentry |
| [docs/SCHEMA_ROADMAP.md](docs/SCHEMA_ROADMAP.md) | Modelos Prisma |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | Convenciones del repo |
| [.cursor/rules/](.cursor/rules/) | Reglas Cursor por módulo |

## Rutas destacadas

| Ruta | Descripción |
|------|-------------|
| `/shop` | Tienda B2C |
| `/recetas` | Catálogo de recetas |
| `/pro/tech-generator` | Agente IA de recetas |
| `/bar-online` | Salas realtime (chat / vídeo / cata) |
| `/comunidad` | Foro |
| `/cuenta/integraciones` | Shopify / Holded / Square |
| `/admin` | Panel administración (2FA) |
| `/mapa` | Mapa interactivo (50 Best + afiliados) |
| `/locales/[slug]` | Ficha pública SEO de cada local |

Los afiliados editan lore y reservas en `/cuenta/bar`.
