# Copilot / AI Agent Instructions for Vermut El Travieso

Purpose: Help AI agents make safe, accurate edits in this Next.js 14 App Router monorepo.

- Big picture:
  - The app is built with Next.js 14 App Router. Pages and routes live under `app/`, reusable UI is in `components/`.
  - Shared server-side helpers, API clients, and integration wrappers live under `lib/`.
  - Database access uses Prisma with the schema at `prisma/schema.prisma` and the singleton client in `lib/prisma.ts`.
  - Auth uses `next-auth` credentials provider with a Prisma adapter, plus optional 2FA via `otplib` and `qrcode`.

- Key workflows / commands:
  - `npm run dev` → `next dev`
  - `npm run build` → `next build`
  - `npm run start` → `next start`
  - `npm run lint` → `next lint` (ESLint runs during `npm run build`)
  - `npm run test` → Vitest unit tests; set `SMOKE_BASE_URL` for E2E smoke tests
  - `npm run smoke` → `scripts/smoke-routes.ts` (requires dev server)
  - `npm run seed:cocktails` → `ts-node scripts/seed-cocktails.ts`
  - After Prisma schema edits, run `npx prisma generate` and/or `npx prisma migrate dev` as needed.

- Project-specific patterns:
  - API route files are under `app/api/.../route.ts` and export `GET`, `POST`, `PUT`, etc. Do not assume Next.js pages-style API routes.
  - Use `import prisma from '@/lib/prisma'` everywhere instead of `new PrismaClient()`.
  - Use `NextResponse.json(...)` for route responses and return proper status codes.
  - Client components need `'use client'`; server code should remain in `app/api/*` or `lib/*`.
  - Use path aliases like `@/lib/...`, `@/data/...`, `@/components/...` from `tsconfig.json`.

- Auth and session flow:
  - `lib/auth.ts` contains `authOptions` for NextAuth credentials auth.
  - `app/api/auth/[...nextauth]/route.ts` exports the NextAuth handler.
  - Registration is handled at `app/api/auth/register/route.ts`.
  - 2FA setup lives in `app/api/auth/setup-2fa/route.ts` using `getServerSession(authOptions)` and `otplib`.
  - Sessions are stored in the database (`session.strategy = 'database'`).

- Integrations / external dependencies:
  - Stripe checkout is implemented in `lib/stripe/api.ts` and used by `app/api/checkout/route.ts`.
  - `app/api/checkout/route.ts` validates cart items against Holded stock before creating a Stripe session.
  - Holded integration is in `lib/holded/api.ts` and `lib/holded.service.ts`; catalog sync in `lib/integrations/holded-catalog.ts`.
  - Square catalog sync: `lib/integrations/square-catalog.ts`; TPV variant resolution: `lib/integrations/resolve-variant.ts`.
  - Shopify OAuth/sync/webhook: `lib/integrations/shopify.ts`; shared upsert: `lib/integrations/catalog-upsert.ts`.
  - TPV webhook: `app/api/tpv/webhook/route.ts` (token + provider + HMAC). UI: `/cuenta/integraciones`.
  - Stripe webhook validates signatures via `STRIPE_WEBHOOK_SECRET` in `app/api/stripe/webhook/route.ts`.
  - See `docs/INTEGRACIONES.md` for integration details.
  - AI text/image generation uses `lib/ai/provider.ts` (`@google/genai`, Groq via OpenAI-compatible API, OpenAI, HuggingFace). Provider priority and fallbacks are documented in that file; availability helpers live in `lib/ai/availability.ts`.
  - `app/api/ai/agent/route.ts` creates and persists recipes with validated structure (title, glass, ingredients, method).
  - **Recipe agent**: UI at `app/pro/tech-generator/page.tsx` (tab *Agente de Recetas*), API `POST /api/ai/agent`, health `GET /api/ai/status`. Persists to Prisma when the user has a session. See `AGENTS.md` for setup.

- Environment variables to preserve:
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_APP_URL`
  - `HOLDED_API_KEY`, `SQUARE_ENVIRONMENT`
  - `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`
  - `AI_RATE_LIMIT_WINDOW_MS`, `AI_RATE_LIMIT_ANON_MAX`, `AI_RATE_LIMIT_AUTH_MAX`
  - `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_IMAGE_MODEL`
  - `GROQ_API_KEY`, `GROQ_MODEL`
  - `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_IMAGE_MODEL`
  - `HUGGINGFACE_API_KEY`
  - `AI_PROVIDER`, `AI_IMAGE_PROVIDER`
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`

- Data and seeding:
  - Static data sources include `data/alcohol-encyclopedia.json` and `data/cocktails.json`.
  - `scripts/seed-cocktails.ts` generates `data/cocktails.json` from the CSV `Recetas_Solo_Vermut_Rojo_El_Travieso.csv`.

- Files to review before edits:
  - `app/api/auth/[...nextauth]/route.ts`
  - `app/api/auth/register/route.ts`
  - `app/api/auth/setup-2fa/route.ts`
  - `app/api/checkout/route.ts`
  - `app/api/stripe/webhook/route.ts`
  - `app/api/holded/stock/route.ts`
  - `app/api/ai/agent/route.ts`, `app/api/ai/status/route.ts`
  - `lib/stripe/api.ts`, `lib/holded/api.ts`, `lib/ai/provider.ts`, `lib/ai/availability.ts`, `lib/prisma.ts`
  - `scripts/seed-cocktails.ts`, `data/alcohol-encyclopedia.json`, `data/cocktails.json`

- Editing rules for this repo:
  1. Keep changes minimal and aligned with existing App Router conventions.
  2. When changing Prisma models, update `prisma/schema.prisma` and regenerate Prisma client.
  3. Prefer existing `lib/` wrappers for external APIs instead of duplicating logic.
  4. Preserve current auth, checkout, and Holded flows unless the change explicitly targets them.

If anything here is unclear or incomplete, ask for feedback on summary sections like auth, checkout, or AI integration.
