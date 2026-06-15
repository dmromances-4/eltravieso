# Documentación del proyecto

Índice de guías para desarrolladores y agentes IA.

## Agentes IA

| Documento | Contenido |
|-----------|-----------|
| [AUDITORIA-TECNICA.md](./AUDITORIA-TECNICA.md) | Auditoría técnica exhaustiva (arquitectura, funcional, APIs, seguridad, 16 secciones) |
| [MEMORIA-CODIGO.md](./MEMORIA-CODIGO.md) | Memoria del proyecto en lenguaje accesible + comandos |
| [AGENTS.md](../AGENTS.md) | Guía principal (setup, módulos, calidad, seguridad) |
| [.github/copilot-instructions.md](../.github/copilot-instructions.md) | Convenciones de código y archivos clave |
| [.cursor/rules/](../.cursor/rules/) | Reglas Cursor por módulo (`.mdc`) |

## Módulos

| Documento | Contenido |
|-----------|-----------|
| [AUDITORIA-RECETAS.md](./AUDITORIA-RECETAS.md) | Comparación con Difford's Guide (CLI + admin) |
| [BAR-ONLINE.md](./BAR-ONLINE.md) | Salas realtime Socket.IO |
| [GUIA-LOCALES.md](./GUIA-LOCALES.md) | Mapa, fichas SEO y pipeline 50 Best |
| [ADMIN.md](./ADMIN.md) | Panel de administración |
| [ESCALADO.md](./ESCALADO.md) | Producción: Vercel, Render, Redis, Sentry |
| [INTEGRACIONES.md](./INTEGRACIONES.md) | Shopify, Holded, Square, TPV |
| [SCHEMA_ROADMAP.md](./SCHEMA_ROADMAP.md) | Modelos Prisma y superficies UI |
| [RECETAS-LIBRO-ESTILO.md](./RECETAS-LIBRO-ESTILO.md) | Estilo editorial del catálogo |
| [PORTADAS-RECETAS.md](./PORTADAS-RECETAS.md) | Portadas 100% gratuitas: Pexels/Unsplash + Gemini |
| [SECRETOS.md](./SECRETOS.md) | Claves API, rotación, `npm run check:env` |
| [GUIA-REFERENCIA-ANIMACION.md](./GUIA-REFERENCIA-ANIMACION.md) | Cartoon clásico 60s–80s: análisis, prompts IA, integración recipe-videos |
| [VIDEOS-RECETAS.md](./VIDEOS-RECETAS.md) | Pipeline Remotion: beats, CLI, principios cartoon |
| [story-universe/01_universe_overview.md](./story-universe/01_universe_overview.md) | Motor narrativo cócteles → historias → animación |
| [FICHAS-COCTEL.md](./FICHAS-COCTEL.md) | Fichas editoriales Figma + Notion (+ Canva) |
| [CAMPANAS.md](./CAMPANAS.md) | Campañas email / SMS / WhatsApp desde admin |
| [PANTALLA.md](./PANTALLA.md) | Hub media: TMDB, podcasts RSS, directo, eventos |
| [DISENO-MARCA.md](./DISENO-MARCA.md) | Paleta Amarillo/Azul/Rojo y componentes UI |
| [SHOPIFY-PLUGIN.md](./SHOPIFY-PLUGIN.md) | Plugin Cursor Shopify: GraphQL, CLI, Liquid |

## Setup local

```bash
cp .env.example .env.local
docker compose up -d          # Postgres + Redis (opcional)
npm install
npm run db:setup
npm run dev                   # Next.js :3000
npm run dev:ws                # Bar Online :3001 (opcional)
```

Ver [AGENTS.md — Desarrollo local](../AGENTS.md#desarrollo-local).
