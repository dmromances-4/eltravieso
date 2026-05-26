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
  - `npm run lint` → `next lint`
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
  - Holded integration is in `lib/holded/api.ts`; `app/api/stripe/webhook/route.ts` syncs completed checkout sessions to Holded.
  - The Stripe webhook currently does not validate signatures; preserve the existing behavior unless explicitly asked to harden it.
  - AI generation is routed through `lib/ai/provider.ts`, which prefers `OPENAI_API_KEY` but can fall back to `HUGGINGFACE_API_KEY`.
  - `app/api/ai/generate-sheet/route.ts` can optionally upload generated images to Supabase if `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured.
  - `app/api/ai/agent/route.ts` uses server-side auth and can persist generated recipes to Prisma when a user is logged in.
  - Note: `package.json` also lists `@google/generative-ai`, but current source code does not import or use it.

- Environment variables to preserve:
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - `STRIPE_SECRET_KEY`
  - `NEXT_PUBLIC_APP_URL`
  - `HOLDED_API_KEY`
  - `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_IMAGE_MODEL`
  - `HUGGINGFACE_API_KEY`
  - `AI_PROVIDER`
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
  - `lib/stripe/api.ts`, `lib/holded/api.ts`, `lib/ai/provider.ts`, `lib/prisma.ts`
  - `scripts/seed-cocktails.ts`, `data/alcohol-encyclopedia.json`, `data/cocktails.json`

- Editing rules for this repo:
  1. Keep changes minimal and aligned with existing App Router conventions.
  2. When changing Prisma models, update `prisma/schema.prisma` and regenerate Prisma client.
  3. Prefer existing `lib/` wrappers for external APIs instead of duplicating logic.
  4. Preserve current auth, checkout, and Holded flows unless the change explicitly targets them.

If anything here is unclear or incomplete, ask for feedback on summary sections like auth, checkout, or AI integration.
