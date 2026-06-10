# Diseño de marca — El Travieso



Dirección visual: **editorial nocturno** — oscuro como marca vermut, limpio como Zara, contundente en hero como Vicio, catálogos legibles como Difford's.



## Colores



| Nombre | Hex | Tailwind | Uso |

|--------|-----|----------|-----|

| Amarillo | `#F9D142` | `electric-yellow`, `brand-yellow` | **Solo** CTAs primarios y estado activo (máx. 1 acento fuerte por pantalla) |

| Azul | `#2B87B9` | `electric-blue`, `brand-blue` | Enlaces secundarios, metadata (vaso, categoría, «ver ficha») |

| Rojo | `#A62125` | `electric-red`, `brand-red` | Bar Online, admin, VIP — **nunca** en catálogo general |



Fuente única: [`lib/theme/tokens.ts`](../lib/theme/tokens.ts) → [`tailwind.config.ts`](../tailwind.config.ts) → [`app/globals.css`](../app/globals.css).



Verificación: `npm run check:design` (falla si aparecen `#FFCC00`, `#00A3E0`, `#EF2A2A`, `rgba(255,204,0…)`).



## Tipografía



| Clase / token | Uso |

|---------------|-----|

| `font-display` / `--font-display` | H1, H2 (Playfair Display) |

| `font-sans` / Montserrat | Cuerpo, UI |

| `.text-display` | Hero y títulos de página |

| `.text-title` | H2 de sección |

| `.text-body` | Párrafos (`text-slate-300`) |

| `.text-caption` / `.eyebrow` | Etiquetas azules, sentence case |



**Evitar:** `uppercase` + `tracking-[0.2em+]` en navegación y catálogos. Jerarquía por tamaño y peso, no por espaciado agresivo.



## Superficies (tema oscuro)



- Fondo general: `#0A0A0A`

- Paneles: `#111111` (`--surface-panel`)

- Texto cuerpo: `text-slate-300`

- Texto secundario: `text-slate-400`

- Radios: `--radius-card` (1rem), `--radius-pill` (pill)



Utilidades globales: `.section-shell`, `.section` vía [`Section`](../components/ui/Section.tsx).



## Componentes UI



| Componente | Ruta | Rol |

|------------|------|-----|

| `BrandButton` / `BrandLinkButton` | `components/ui/BrandButton.tsx` | CTAs sentence case: primary, secondary, danger, ghost |

| `BrandLink` | `components/ui/BrandLink.tsx` | Enlaces azul → blanco hover |

| `PageHero` | `components/ui/PageHero.tsx` | Eyebrow + título + lead |

| `Section` | `components/ui/Section.tsx` | Spacing vertical + shell |

| `EditorialCard` | `components/ui/EditorialCard.tsx` | Catálogos (recetas, shop, pantalla) |

| `MetaChip` | `components/ui/MetaChip.tsx` | ABV, kcal, rating, categoría |

| `NavGroup` | `components/ui/NavGroup.tsx` | Header agrupado Descubrir / Pro / Comunidad |

| `SurfaceCard` | `components/ui/SurfaceCard.tsx` | Portal home 2×2 |



## Dosificación de color



1. **No** usar `bg-red-600` — usar `bg-electric-red`.

2. **No** hardcodear hex legacy — importar desde `brandColors`.

3. Amarillo: un CTA principal por vista; chips activos en filtros OK.

4. Azul: links «Ver receta →», metadata, focus de inputs de búsqueda.

5. Rojo: admin, VIP, Bar Online, directo en Pantalla.

6. Sombras: `shadow-card` / `shadow-subtle` — evitar `shadow-neon` en catálogos nuevos.

7. Motion: scale sutil en imagen (`group-hover:scale-[1.02]`), sin `animate-ping` ni `-translate-y-8`.



## Navegación (shell)



| Grupo | Enlaces |

|-------|---------|

| Descubrir | Recetas, Alcoholes, Shop, Blog |

| Pro | Barra IA, Mapa, Pantalla |

| Comunidad | Bar Online, Comunidad |



## Desarrollo local



```bash

npm run check:local   # BD, migraciones, WS, URLs auth

npm run check:design  # tokens legacy

npm run dev           # Next.js :3000

npm run dev:ws        # Bar Online :3001 (segunda terminal)

```



Ver [`AGENTS.md`](../AGENTS.md).

