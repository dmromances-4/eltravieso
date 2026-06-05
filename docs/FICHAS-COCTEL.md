# Fichas editoriales de cócteles

Publicación user-friendly del catálogo El Travieso en Figma, Notion y (opcional) Canva, alimentada desde `data/cocktails.json`.

## Objetivo

- Plantilla visual reutilizable (Figma) alineada con [`CocktailCard.tsx`](../components/CocktailCard.tsx) y [`app/recetas/[slug]/page.tsx`](../app/recetas/[slug]/page.tsx).
- Base editorial en Notion con recetas revisadas (`reviewStatus`: `ok` | `fixed`).
- Exportación repetible vía CLI sin depender de copiar/pegar manual del JSON.

## Fuentes de datos

| Recurso | Ubicación |
|---------|-----------|
| Catálogo | `data/cocktails.json` (~419 recetas) |
| Tipos | `types/cocktail.ts` (`CocktailRecord`) |
| I/O | `lib/recipes/cocktails-io.ts` (`loadCocktails()`) |
| Ficha web | `/recetas/[slug]` |

## Herramientas externas

| Herramienta | Uso | Estado |
|-------------|-----|--------|
| Figma MCP | Archivo maestro + componente `CocktailFicha` | Piloto OK (escalado diferido) |
| Notion MCP | Base «Fichas Cócteles — El Travieso» | 92 entradas |
| Canva MCP | Stories/redes (opcional) | No conectado — ver sección Canva |

## Checklist pre-vuelo (Fase 1)

1. [x] Figma MCP conectado (cuenta activa).
2. [x] Notion MCP conectado y autenticado.
3. [x] `npm run export:cocktails-fichas -- --limit 20` genera salida en `data/exports/`.
4. [x] Crear archivo Figma «Fichas Cócteles — El Travieso» con plantilla 1080×1350.
5. [x] Crear base Notion e importar lote piloto (20 recetas).
6. [x] Actualizar esta guía con URLs e IDs (sección «Estado del piloto»).

## Export CLI

```bash
# Por defecto: solo ok/fixed, JSON en data/exports/
npm run export:cocktails-fichas

# Lote piloto para Notion
npm run export:cocktails-fichas -- --limit 20

# Todo el catálogo, CSV
npm run export:cocktails-fichas -- --all --format csv

# Formato Notion (JSON con bloques listos)
npm run export:cocktails-fichas -- --format notion --limit 20
```

Variables opcionales:

- `NEXT_PUBLIC_APP_URL` — base para enlaces `/recetas/{slug}` (default `http://localhost:3000`).

## Plantilla Figma

Campos de la ficha:

- Hero (cover), título, vaso
- Chips: ABV, kcal, rating
- Lista de ingredientes
- Preparación (pasos numerados)
- Footer: marca El Travieso + URL receta

Tokens: fondo `#0A0A0A`, acento amarillo (`electric-yellow`), tipografía display.

## Base Notion (esquema)

| Propiedad | Tipo |
|-----------|------|
| Nombre | title |
| Slug | text |
| Vaso | select |
| ABV / Kcal / Rating | number o text |
| Estado revisión | select |
| URL web | url |
| Difford's | url |
| Ingredientes | text |
| Preparación | text |

## Canva (opcional)

Canva **no está conectado** por defecto. Para habilitar el MCP en Cursor:

1. Editar `~/.cursor/mcp.json` y añadir:

```json
{
  "mcpServers": {
    "canva": {
      "url": "https://mcp.canva.com/mcp"
    }
  }
}
```

Alternativa: `@canva/cli mcp` (ver [documentación Canva MCP](https://www.canva.com/help/mcp/)).

2. Reiniciar Cursor y autenticar con la cuenta Canva.
3. Exportar PNG desde Figma → plantillas Canva para stories/redes.

**Fase 1.4 (opcional):** no requiere cambios en el repo hasta que el MCP esté activo.

## Escalado (2026-06-05)

| Destino | Conteo | Notas |
|---------|--------|-------|
| Export CLI (`ok`/`fixed`) | 92 | `npm run export:cocktails-fichas -- --format notion` |
| Notion | 92 | Data source `d8df242c-de72-49f9-83cd-e6383aaf503b` |
| Figma | 5 (piloto) | Escalado a ~92 frames **diferido** — plantilla lista en archivo maestro |

Anti-duplicados Notion al reimportar:

```bash
npm run import:cocktails-notion -- \
  --input data/exports/cocktail-fichas-notion-reviewed-*.json \
  --skip-slugs-file data/exports/notion-existing-slugs.txt
```

Los artefactos en `data/exports/` están en `.gitignore` (generados localmente).

## Estado del piloto

| Elemento | Valor |
|----------|-------|
| Figma file URL | https://www.figma.com/design/KkkCcj3CHh9nXU8R58tSiO |
| Figma file key | `KkkCcj3CHh9nXU8R58tSiO` |
| Notion database URL | https://app.notion.com/p/974a610df6d5413abfc3e92534c4d720 |
| Notion data source ID | `d8df242c-de72-49f9-83cd-e6383aaf503b` |
| Recetas exportadas | 92 (`ok`/`fixed`) |
| Fichas Figma instanciadas | 5 (plantilla + 4 piloto en página «Fichas Piloto») |
| Entradas Notion | 92 |
| Última actualización | 2026-06-05 |

## Próximo paso

Escalar Figma al resto de recetas revisadas (~87 instancias desde plantilla). Opcional: conectar Canva MCP y derivar assets para redes.
