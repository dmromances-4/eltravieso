# Campañas de marketing (email / SMS / WhatsApp)

Módulo admin para enviar comunicaciones a usuarios con consentimiento explícito (RGPD).

## Alcance MVP

| Canal | Proveedor | Estado |
|-------|-----------|--------|
| Email | [Resend](https://resend.com/) | Implementado |
| SMS | [Twilio](https://www.twilio.com/) | Implementado (requiere credenciales) |
| WhatsApp | Twilio | Implementado (requiere sender + plantillas aprobadas) |

Fuera de alcance MVP: CSV masivo, programación cron, A/B, editor visual drag-and-drop.

## Rutas

| Recurso | Ubicación |
|---------|-----------|
| Panel | `/admin/campaigns` |
| Nueva campaña | `/admin/campaigns/new` |
| Detalle / envío | `/admin/campaigns/[id]` |
| API list/create | `GET/POST /api/admin/campaigns` |
| API detalle | `GET/PATCH /api/admin/campaigns/[id]` |
| Preview | `POST /api/admin/campaigns/[id]/preview` |
| Enviar | `POST /api/admin/campaigns/[id]/send` |
| Baja email | `GET /api/marketing/unsubscribe?token=…` |

## Modelo de datos

- `MarketingConsent` — opt-in por canal (`emailOptIn`, `smsOptIn`, `whatsappOptIn`)
- `Campaign` — borrador, canal, cuerpo, audiencia (JSON); enums `CampaignChannel`, `CampaignStatus`
- `CampaignMessage` — registro por destinatario (`CampaignMessageStatus`: queued/sent/failed)

## Consentimiento GDPR

- Registro: checkboxes separados email vs SMS/WhatsApp → `MarketingConsent`
- Solo se envía a usuarios con opt-in del canal correspondiente
- Emails incluyen enlace de baja firmado (`MARKETING_UNSUBSCRIBE_SECRET`)

## Variables de entorno

```bash
RESEND_API_KEY=
MARKETING_FROM_EMAIL=noreply@tudominio.com
MARKETING_UNSUBSCRIBE_SECRET=   # min 32 chars

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_MESSAGING_SERVICE_SID=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

## Flujo operativo

1. Admin crea campaña en borrador (`DRAFT`).
2. `Preview` envía una copia al email/teléfono del admin.
3. `Enviar` resuelve audiencia, crea `CampaignMessage` por destinatario y envía en lotes (50/min).
4. Estado pasa a `SENT` o `FAILED` según resultados.

## En curso

Implementado en repo (2026-06-05). Ver rutas arriba y variables en `.env.example`.

## Variables en producción (Vercel)

Configurar en **Production** (y Preview si aplica):

| Variable | Obligatorio | Notas |
|----------|-------------|-------|
| `RESEND_API_KEY` | Email | Remitente verificado en Resend |
| `MARKETING_FROM_EMAIL` | Email | Debe coincidir con dominio verificado |
| `MARKETING_UNSUBSCRIBE_SECRET` | Email | Mín. 32 caracteres |
| `MARKETING_MOCK` | No | `false` en prod real |
| `TWILIO_ACCOUNT_SID` | SMS/WhatsApp | Solo si se usa canal Twilio |
| `TWILIO_AUTH_TOKEN` | SMS/WhatsApp | |
| `TWILIO_MESSAGING_SERVICE_SID` | SMS | Opcional si usas `TWILIO_SMS_FROM` |
| `TWILIO_WHATSAPP_FROM` | WhatsApp | Sender aprobado |

No commitear valores en el repo; usar Vercel Dashboard o `vercel env add`.

## Verificación

### Automatizada (local)

```bash
MARKETING_MOCK=true npm run smoke:marketing
npm run test
```

Smoke comprueba: token de baja HMAC, resolución de audiencia (BD local), estado de env vars.

### Manual (producción)

1. Crear usuario de prueba con opt-in email en `/register`.
2. `/admin/campaigns/new` → borrador email → **Preview** → comprobar recepción.
3. **Enviar** campaña de prueba con asunto `[TEST]`.
4. Abrir enlace de baja del email → `GET /api/marketing/unsubscribe?token=…`.
5. SMS/WhatsApp: repetir solo si `TWILIO_*` configurado; si no, anotar «bloqueado — sin credenciales».

### Resultados smoke local (2026-06-05)

| Check | Resultado |
|-------|-----------|
| Unsubscribe token HMAC | OK |
| `resolveCampaignRecipients` | OK (EMAIL=0, SMS=0 en BD local sin opt-in) |
| `RESEND_API_KEY` | missing (esperado en dev) |
| `MARKETING_FROM_EMAIL` | missing |
| `TWILIO_ACCOUNT_SID` | missing |
| `MARKETING_MOCK` | true |

Envío real prod: pendiente — configurar `RESEND_*` en Vercel y ejecutar pasos manuales arriba. Twilio: bloqueado sin credenciales.

## Próximo paso

Configurar `RESEND_API_KEY` en Vercel Production y ejecutar verificación manual. Twilio opcional.
