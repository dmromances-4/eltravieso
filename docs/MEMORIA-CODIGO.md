# Memoria del código — eltravieso

Documento para entender el proyecto **sin conocimientos de programación**. Explica qué es la plataforma, cómo encajan sus piezas y qué comandos usar en el día a día.

**Fecha:** 14 de junio de 2026  
**Estado demo local:** operativo (integraciones externas y pagos Stripe desactivados en demo)

---

## 1. Qué es eltravieso

**eltravieso** es una plataforma digital de vermut y coctelería que combina:

- **Tienda online** — productos, carrito y checkout (pagos con Stripe cuando está configurado).
- **Recetario** — cientos de cócteles con fichas editoriales.
- **Agente de recetas (IA)** — crea recetas nuevas a partir de una descripción en lenguaje natural.
- **Biblioteca** — libros de referencia sobre coctelería.
- **Enciclopedia de alcoholes** — fichas de destilados y licores.
- **Blog y comunidad** — artículos y foro.
- **Mapa de locales** — guía de bares y restaurantes (World's 50 Best + perfiles de bares).
- **Pantalla** — hub de series, películas, podcasts y directos.
- **Bar Online** — salas en directo (chat, vídeo, cata) entre profesionales.
- **Área de cuenta** — perfil, recetas propias, membresía VIP, bar profesional.
- **Panel admin** — gestión de productos, recetas, campañas, reparto, fiscal, etc.

Está pensada para **consumidores (B2C)**, **bares y profesionales (B2B)** y **administradores** del negocio.

---

## 2. Analogía: el edificio digital

Imagina el proyecto como un local con varias plantas:

| Pieza técnica | Analogía | Qué hace |
|---------------|----------|----------|
| **Pantallas web** (`app/`) | Mostrador y salas del local | Lo que ves al abrir `http://localhost:3000` |
| **API** (`app/api/`) | Cocina trasera | Procesos que la web llama sin que los veas (login, carrito, IA…) |
| **Reglas de negocio** (`lib/`) | Recetas internas del equipo | Cómo calcular precios, validar usuarios, enviar emails… |
| **Base de datos** (PostgreSQL + Prisma) | Archivo y almacén | Usuarios, pedidos, recetas guardadas, locales del mapa… |
| **Ficheros JSON** (`data/`) | Catálogos en papel | Listas grandes (cócteles, productos, libros) que se leen al arrancar |
| **NextAuth** | Portero | Controla quién entra (login, sesiones, 2FA opcional) |
| **Supabase Storage** | Almacén de fotos/vídeos | Solo archivos; **no** gestiona usuarios aquí |
| **Stripe** | Caja registradora | Pagos de tienda, VIP y planes del mapa |
| **Bar Online** (puerto 3001) | Sala de reuniones aparte | Chat y vídeo en tiempo real |
| **Scripts** (`scripts/`) | Herramientas de taller | Importar datos, auditar recetas, sembrar demo… |

---

## 3. Mapa de módulos (URLs públicas)

| Módulo | URL | Para quién | Qué hace |
|--------|-----|------------|----------|
| Inicio | `/` | Todos | Presentación de marca y destacados |
| Tienda | `/shop` | Clientes | Catálogo de productos |
| Carrito | `/cart` | Clientes | Productos seleccionados |
| Checkout | `/checkout` | Clientes | Revisión del pedido (pago si Stripe activo) |
| Recetas | `/recetas` | Todos | Catálogo de cócteles |
| Ficha receta | `/recetas/[slug]` | Todos | Ingredientes, método, vaso |
| Agente IA | `/pro/tech-generator` | Profesionales | Generar receta con IA |
| Biblioteca | `/biblioteca` | Todos | Libros de coctelería |
| Alcoholes | `/alcoholes` | Todos | Enciclopedia de destilados |
| Ficha alcohol | `/alcoholes/[slug]` | Todos | Ficha editorial (JSON canónico `data/alcohol-encyclopedia.json`, IDs `SP-*`) |
| Blog | `/blog` | Todos | Hub editorial: Escrito / Vídeo / Podcast + voces hispanas (`docs/BLOG-EDITORIAL.md`) |
| Comunidad | `/comunidad` | Usuarios | Foro de temas |
| Mapa | `/mapa` | Todos | Globo 3D interactivo de locales (capas, filtros, enlace desde ficha) |
| Ficha local | `/locales/[slug]` | Todos | Detalle de un bar/restaurante (gastronomía, preferencias, links) |
| Pantalla | `/pantalla` | Todos | Series, podcasts, eventos |
| Bar Online | `/bar-online` | Usuarios logueados | Lobby de salas en directo |
| Login | `/login` | Todos | Entrar en la cuenta |
| Cuenta | `/cuenta/*` | Usuarios | Perfil, bar, membresía, integraciones |
| Admin | `/admin/*` | Administradores | Panel de gestión |

---

## 4. Panel de administración

Acceso: usuario con rol **ADMIN**. En demo local: `ADMIN_REQUIRE_2FA=false` (sin doble factor).

| Sección | URL |
|---------|-----|
| Dashboard | `/admin` |
| Productos | `/admin/products` |
| Marketplace | `/admin/marketplace` |
| Mayorista | `/admin/wholesale` |
| Producción | `/admin/production` |
| Recetas | `/admin/recipes` |
| Auditoría Difford's | `/admin/recetas-auditoria` |
| Blog | `/admin/posts` |
| Campañas | `/admin/campaigns` |
| Reparto | `/admin/delivery` |
| Fiscal | `/admin/tax-registry` |
| Foro | `/admin/forum` |
| Pantalla | `/admin/pantalla` |
| VIP drops | `/admin/vip-drops` |

**Credenciales demo (solo local):**

- Email: `demo@eltravieso.bar`
- Contraseña: `demo1234`

---

## 5. Programas y servicios que usa el proyecto

| Programa | Obligatorio | Para qué |
|----------|-------------|----------|
| **Node.js 18+** | Sí | Motor que ejecuta la aplicación |
| **PostgreSQL** | Sí | Base de datos (Docker `:5432` o embebido `:5433`) |
| **Redis** | Opcional local | Bar Online multi-instancia; rate limits |
| **Next.js 14** | Sí | Framework de la web |
| **Prisma** | Sí | Puente entre código y base de datos |
| **NextAuth** | Sí | Login y sesiones |
| **Gemini / Groq / OpenAI** | Opcional | Agente IA (`AI_MOCK=true` para demo sin claves) |
| **Stripe** | Opcional | Pagos (desactivado en demo actual) |
| **Resend + Twilio** | Opcional | Campañas email/SMS (`MARKETING_MOCK=true` en demo) |
| **Supabase Storage** | Opcional | Subida de imágenes y vídeos |
| **TMDB** | Opcional | Importar series/películas en Pantalla |
| **Shopify / Holded / Square** | Excluido en demo | Integraciones TPV (ver `/cuenta/integraciones`) |

**Producción:** web en **Vercel**, Bar Online en **Render**, Redis en **Upstash**.

---

## 6. Cómo arrancar el proyecto (comandos)

### Instalación inicial

```bash
cp .env.example .env.local
# Editar .env.local (ver sección 7)

docker compose up -d          # Postgres + Redis (opcional)
npm install
npm run db:setup              # Tablas + datos demo
npm run scrape:venues -- --report  # checklist: history/verdict ≥80%, website ≥50%
npm run seed:venues           # importar JSON a la base de datos
npm run geocode:venues        # coordenadas en el mapa
npm run enrich:tripadvisor -- --suggest  # CSV sugerencias TripAdvisor
npm run check:local             # Diagnóstico
```

Los afiliados completan **campos editoriales** (cocina, ambiente, precios, preferencias con dress code, Instagram/TikTok) en `/cuenta/bar`. Taxonomía: `lib/venues/taxonomy.ts`. Ficha pública: `VenueDetailBlocks`.

### Uso diario (dos terminales)

```bash
# Terminal 1 — web
npm run dev
# Abrir http://localhost:3000 (nunca 127.0.0.1)

# Terminal 2 — Bar Online
npm run dev:ws
# WebSocket en http://localhost:3001
```

### Calidad y verificación

```bash
npm run test                  # Tests unitarios (138+)
npm run lint                  # Revisión de estilo de código
npm run build                 # Build de producción
npm run smoke                 # Rutas clave (con dev activo)
SMOKE_BASE_URL=http://localhost:3000 npm run test   # Smoke E2E
MARKETING_MOCK=true npm run smoke:marketing
```

### Datos y catálogos

| Comando | Qué hace |
|---------|----------|
| `npm run db:local` | Postgres embebido sin Docker (puerto 5433) |
| `npm run db:setup` | Migraciones + seed demo + conservas |
| `npm run seed:admin` | Usuario administrador |
| `npm run seed:cocktails` | Recetas en base de datos |
| `npm run seed:venues` | Locales del mapa desde JSON |
| `npm run geocode:venues` | Geocodificar direcciones del mapa |
| `npm run build:data` | Importar recetas + construir productos |
| `npm run sync:catalog` | Orquestador: productos + recetas + locales (JSON; `--seed` para Postgres) |
| `npm run scrape:products` | Scrapear URLs de productos |
| `npm run scrape:venues` | Scrapear World's 50 Best |
| `npm run import:spirits` | Importar destilados de retailers |
| `npm run merge:alcohol-encyclopedia` | Fusionar `spirits-import.json` → `alcohol-encyclopedia.json` (IDs `SP-*`, dedup por `sourceUrl`) |
| `npm run import:tmdb` | Importar cine/series en Pantalla |
| `npm run sync:podcast-feeds` | Sincronizar podcasts RSS |

**`sync:catalog`** — orden: productos (CSV → enrich → scrape) → recetas (import → normalize → audit pending) → locales (50 Best, `--detail-only` por defecto). Flags: `--only products|recipes|venues`, `--dry-run`, `--skip-scrape`, `--seed`, `--geocode`, `--tripadvisor-suggest`, `--limit N`, `--full-venues`. Informe en `.scrape-cache/sync-catalog/`. Dedup: productos/recetas por `slug`, recetas `id` (`dg-*` / `slug-*`), locales por `sourceUrl`.

### Recetas e IA

| Comando | Qué hace |
|---------|----------|
| `npm run audit:recipes` | Auditar recetas vs Difford's Guide |
| `npm run audit:recipes:backfill` | Rellenar IDs Difford's |
| `npm run export:cocktails-fichas` | Exportar fichas editoriales |
| `npm run generate:recipe-images` | Portadas realistas 100% gratis (Pexels/Unsplash + Gemini). Ver [`docs/PORTADAS-RECETAS.md`](./PORTADAS-RECETAS.md) |
| `npm run polish:recipes` | Pulir textos de recetas |
| `npm run render:recipe-videos` | Vídeos Remotion de recetas |

Ejemplos con opciones:

```bash
npm run audit:recipes -- --limit 5 --dry-run
npm run generate:recipe-images -- --discover-only --limit 10
npm run generate:recipe-images -- --limit 5 --slug negroni
npm run import:tmdb -- --tv 1399 --seasons all
```

### Producción

```bash
npm run build
npm run start                 # Web en producción
npm run start:ws              # Bar Online en producción
npm run vercel-build          # Build Vercel con migraciones
```

---

## 7. Variables de entorno (`.env.local`)

Copia desde `.env.example`. Bloques principales:

| Variable | Significado |
|----------|-------------|
| `DATABASE_URL` | Conexión a PostgreSQL (`5432` Docker o `5433` embebido) |
| `NEXTAUTH_SECRET` | Clave secreta para sesiones (cadena larga aleatoria) |
| `NEXTAUTH_URL` | URL de la app: `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Igual que NEXTAUTH_URL en local |
| `ADMIN_REQUIRE_2FA` | `false` en demo admin; `true` en producción |
| `NEXT_PUBLIC_WS_URL` | URL Bar Online: `http://localhost:3001` |
| `WS_PORT` | Puerto del servidor de sockets (3001) |
| `AI_MOCK` | `true` = IA demo sin API keys |
| `MARKETING_MOCK` | `true` = campañas simuladas sin enviar emails reales |
| `STRIPE_SECRET_KEY` | Pagos (vacío = tienda navegable sin cobro) |
| `GEMINI_API_KEY` / `GROQ_API_KEY` | Agente IA real (alternativa a AI_MOCK) |
| `SUPABASE_*` | Subida de imágenes (opcional) |
| `TMDB_API_KEY` | Import Pantalla (opcional) |

**Mínimo para demo de presentación:**

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vermut"
NEXTAUTH_SECRET="tu-secreto-largo"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_REQUIRE_2FA=false
NEXT_PUBLIC_WS_URL="http://localhost:3001"
AI_MOCK=true
MARKETING_MOCK=true
```

---

## 8. Qué está operativo vs demo

| Funcionalidad | Estado demo |
|---------------|-------------|
| Navegación web pública | Operativo |
| Tienda y carrito | Operativo |
| Checkout / VIP con tarjeta | Desactivado (avisos en pantalla) |
| Agente IA | Operativo con `AI_MOCK=true` |
| Bar Online | Operativo con `npm run dev:ws` |
| Admin completo | Operativo (usuario demo) |
| Campañas marketing | Operativo en modo mock |
| Integraciones Shopify/Holded/Square | Desactivadas (banner informativo) |
| Subida de imágenes Supabase | Requiere claves Supabase |
| Import TMDB Pantalla | Requiere `TMDB_API_KEY` |

---

## 9. Guion de presentación (7 pantallas)

1. **`/`** — Marca y propuesta de valor  
2. **`/shop`** — Catálogo + añadir al carrito  
3. **`/recetas`** + una ficha — Catálogo editorial  
4. **`/pro/tech-generator`** — Crear receta con IA  
5. **`/mapa`** — Globo 3D con ~350 locales (capas Red El Travieso / 50 Best, filtro por continente, «Mi ubicación»)  
6. **`/bar-online`** — Sala en directo (con `dev:ws`)  
7. **`/admin`** — Panel con `demo@eltravieso.bar`  

Mencionar **integraciones y pagos** como evolución futura, no como parte de la demo.

---

## 10. Estructura de carpetas (referencia)

| Carpeta | Contenido |
|---------|-----------|
| `app/` | Páginas y rutas API |
| `components/` | Piezas visuales reutilizables |
| `lib/` | Lógica de negocio |
| `prisma/` | Esquema y migraciones de BD |
| `data/` | JSON de catálogos |
| `scripts/` | Herramientas de línea de comandos |
| `server/realtime/` | Servidor Bar Online |
| `docs/` | Manuales técnicos |
| `tests/` | Comprobaciones automáticas |

---

## 11. Glosario

| Término | Significado sencillo |
|---------|---------------------|
| **API** | Puerta por la que programas intercambian datos |
| **Base de datos** | Archivo estructurado donde se guarda la información |
| **Seed / semilla** | Rellenar la BD con datos de prueba |
| **Slug** | Identificador en la URL (ej. `negroni` en `/recetas/negroni`) |
| **Smoke test** | Comprobar rápido que las páginas principales responden |
| **Migración** | Actualización del diseño de la base de datos |
| **Mock** | Simulación (ej. IA o emails sin servicios reales) |
| **WebSocket** | Conexión en tiempo real (Bar Online) |
| **2FA** | Doble factor: contraseña + código del móvil |
| **B2C / B2B** | Venta a consumidor / venta a negocios (bares) |

---

## 12. Documentación detallada

| Tema | Archivo |
|------|---------|
| Índice | [docs/README.md](./README.md) |
| Admin | [docs/ADMIN.md](./ADMIN.md) |
| Bar Online | [docs/BAR-ONLINE.md](./BAR-ONLINE.md) |
| Integraciones | [docs/INTEGRACIONES.md](./INTEGRACIONES.md) |
| Campañas | [docs/CAMPANAS.md](./CAMPANAS.md) |
| Mapa locales | [docs/GUIA-LOCALES.md](./GUIA-LOCALES.md) |
| Pantalla | [docs/PANTALLA.md](./PANTALLA.md) |
| Producción | [docs/ESCALADO.md](./ESCALADO.md) |
| Guía agentes | [AGENTS.md](../AGENTS.md) |

---

*Generado para la presentación del proyecto eltravieso — entorno local demo.*
