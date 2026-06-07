#!/usr/bin/env tsx
/**
 * Guía interactiva para configurar Resend + Vercel (no escribe secrets).
 * npm run setup:marketing-prod
 */

import crypto from "crypto";

console.log(`
=== Configuración campañas en producción ===

1) RESEND (https://resend.com)
   - Domains → Add domain → copiar registros DNS (SPF + DKIM)
   - API Keys → Create → copiar re_…
   - MARKETING_FROM_EMAIL = remitente del dominio verificado
     (pruebas limitadas: onboarding@resend.dev solo a tu email verificado)

2) VERCEL → Project → Settings → Environment Variables → Production

   RESEND_API_KEY=re_…
   MARKETING_FROM_EMAIL=noreply@TU_DOMINIO.com
   MARKETING_UNSUBSCRIBE_SECRET=${crypto.randomBytes(32).toString("base64")}
   MARKETING_MOCK=false
   NEXT_PUBLIC_APP_URL=https://TU_DOMINIO.com

3) Redeploy Production (Deployments → … → Redeploy)

4) Validar env (tras vercel env pull .env.production.local):
   npm run check:marketing-prod

5) Checklist manual (docs/CAMPANAS.md):
   - Registro con opt-in email
   - /admin/campaigns/new → Preview → Send [TEST]
   - Clic enlace baja → /marketing/unsubscribe?ok=1

Secret generado arriba para MARKETING_UNSUBSCRIBE_SECRET (cópialo a Vercel).
`);
