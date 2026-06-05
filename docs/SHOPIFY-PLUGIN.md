# Plugin Shopify (Cursor) — validación y demo

Guía para usar el plugin de Shopify en Cursor: validar GraphQL contra el esquema real, CLI y Liquid.

## Prerrequisitos

```bash
npm i -g @shopify/cli @shopify/theme
shopify version
shopify auth login
```

En Cursor, el plugin valida operaciones Admin GraphQL sin adivinar campos. Para búsqueda en docs de shopify.dev el agente necesita **acceso a red** (`full_network`).

## GraphQL validado (Admin API)

### Productos con poco stock

Campo correcto: **`totalInventory`** (no `inventoryCount`).

```graphql
query LowStockProducts {
  products(first: 10, query: "inventory_total:<=5") {
    edges {
      node {
        id
        title
        handle
        totalInventory
        variants(first: 5) {
          edges {
            node {
              id
              sku
              inventoryQuantity
            }
          }
        }
      }
    }
  }
}
```

Scopes: `read_products`, `read_inventory`.

### Consulta inválida (rechazada por el validador)

```graphql
# ❌ inventoryCount no existe en Product
query Broken {
  products(first: 5) {
    edges {
      node {
        inventoryCount
      }
    }
  }
}
```

## Integración con este repo

Sync OAuth ya implementado:

- `POST /api/integrations/shopify/sync` — [`lib/integrations/shopify.ts`](../lib/integrations/shopify.ts)
- UI: `/cuenta/integraciones`

Ver [`docs/INTEGRACIONES.md`](./INTEGRACIONES.md).

## Validación Liquid

```bash
mkdir -p /tmp/shopify-theme-check && cd /tmp/shopify-theme-check
shopify theme check --init
echo '{{ product.title }}' > snippets/test.liquid
shopify theme check snippets/test.liquid
```

Si falla por dependencias, instalar Theme Check vía Shopify CLI (`@shopify/cli` ≥ 3.x incluye theme commands).

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Docs search bloqueada | Repetir con red habilitada en Cursor |
| Liquid check sin deps | `shopify theme check --init` en directorio theme de prueba |
| CLI no encontrado | `npm i -g @shopify/cli @shopify/theme` y reiniciar terminal |
| GraphQL scope error | Reautorizar app OAuth con scopes `read_products`, `read_inventory` |

## Resultados demo (2026-06-05)

- Validación GraphQL OK con `totalInventory`
- Campo erróneo `inventoryCount` rechazado por el plugin
- Documentación alineada con sync existente en el monorepo

## Próximo paso opcional

Endpoint admin `GET /api/admin/shopify/low-stock` reutilizando tokens OAuth del bar conectado.

## Log de verificación (2026-06-05)

Comandos ejecutados con `npx` (sin install global):

```bash
npx @shopify/cli version
# → 4.1.0

npx @shopify/cli theme check --help
# → OK (Theme Check integrado en CLI 4.x)
```

| Check | Resultado |
|-------|-----------|
| `@shopify/cli version` | OK — 4.1.0 |
| `theme check --help` | OK |
| `theme check` en theme local | N/A — no hay theme Shopify en el monorepo |
| GraphQL `totalInventory` demo | N/A — requiere `SHOPIFY_*` en `.env.local` / tienda dev conectada |

Para repetir Liquid check con snippet de prueba, ver sección «Validación Liquid» arriba.
