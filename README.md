# Vermut El Travieso

Plataforma B2C/B2B de vermut: tienda, recetas con agente IA, comunidad, Bar Online y panel admin wholesale.

## Requisitos

- Node.js 18+
- PostgreSQL (local vía Docker o remoto)

## Setup rápido

```bash
cp .env.example .env.local
# Edita DATABASE_URL, NEXTAUTH_SECRET y al menos una clave IA (GEMINI_API_KEY o GROQ_API_KEY)

npm install
npm run db:setup   # migrate + seed demo
npm run dev
```

Abre http://localhost:3000

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor Next.js |
| `npm run build` | Build producción (incluye ESLint) |
| `npm run test` | Tests Vitest |
| `npm run smoke` | Smoke de rutas (requiere `npm run dev`) |
| `npm run lint` | ESLint |
| `npm run db:setup` | Migrate + seeds demo |
| `npm run scrape:venues` | Scrape World's 50 Best (bars + restaurants 1-50) |
| `npm run seed:venues` | Importa `data/venues-worlds50best.json` a `VenueGuideEntry` |

E2E con servidor activo:

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run test
```

## Documentación

- [AGENTS.md](AGENTS.md) — guía para agentes IA (recetas, integraciones, calidad)
- [docs/INTEGRACIONES.md](docs/INTEGRACIONES.md) — Shopify, Holded, Square, TPV
- [docs/SCHEMA_ROADMAP.md](docs/SCHEMA_ROADMAP.md) — modelos Prisma y superficies UI
- [.github/copilot-instructions.md](.github/copilot-instructions.md) — convenciones del repo

## Rutas destacadas

| Ruta | Descripción |
|------|-------------|
| `/shop` | Tienda B2C |
| `/recetas` | Catálogo de recetas |
| `/pro/tech-generator` | Agente IA de recetas |
| `/comunidad` | Foro |
| `/cuenta/integraciones` | Shopify / Holded / Square |
| `/admin` | Panel administración |
| `/mapa` | Mapa interactivo (afiliados + destacados 50 Best) |
| `/locales/[slug]` | Ficha pública SEO de cada local |

### Guía de locales

```bash
npm run scrape:venues
npm run seed:venues              # opcional: SEED_VENUES_GEOCODE=true para pins en mapa
npx tsx scripts/backfill-venue-slugs.ts
```

Los afiliados editan lore y reservas en `/cuenta/bar`. Contenido editorial de [World's 50 Best](https://www.theworlds50best.com/) se atribuye en cada ficha.
