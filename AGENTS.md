# Guía para agentes (Cursor / Copilot)

## Agente de recetas (Barra Inteligente)

| Recurso | Ruta |
|--------|------|
| UI | `/pro/tech-generator` (pestaña **Creador de Recetas**, o `?tab=agent`) |
| API generar | `POST /api/ai/agent` — body: `{ "prompt": "..." }` (también `text`, `comment`) |
| API búsqueda | `GET /api/recipes/search?q=melocoton` |
| API estado | `GET /api/ai/status` o `GET /api/ai/agent` |
| Ficha técnica | `POST /api/ai/generate-sheet` — body: `{ "baseRecipe": "..." }` |

### Activar el agente

1. Copiar `.env.example` → `.env.local`
2. Configurar **al menos una** clave de texto (recomendado gratis):
   - `GEMINI_API_KEY` — https://aistudio.google.com/
   - `GROQ_API_KEY` — https://console.groq.com/
3. Opcional: `AI_PROVIDER=gemini|groq|openai|huggingface`
4. `npm run dev` y abrir http://localhost:3000/pro/tech-generator

### Comportamiento

- Busca recetas similares en `cocktails.json` + Prisma antes de generar.
- Siempre persiste en Prisma y aparece en `/recetas` (autor: usuario logueado o cuenta sistema).
- Repara ingredientes vacíos con una segunda llamada a la IA si hace falta.
- Proveedor y fallbacks: `lib/ai/provider.ts` (cadena gemini → groq → openai → huggingface).
- Disponibilidad: `lib/ai/availability.ts`.

### Archivos clave

- `app/api/ai/agent/route.ts`
- `app/pro/tech-generator/page.tsx`
- `lib/ai/provider.ts`
- `lib/ai/availability.ts`
- `.github/copilot-instructions.md` — convenciones del monorepo
