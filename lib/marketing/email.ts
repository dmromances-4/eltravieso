import { unsubscribeUrl } from "@/lib/marketing/unsubscribe";
import type { AppLocale } from "@/i18n/routing";

export type EmailSendInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  userId?: string;
  locale?: AppLocale;
};

export type EmailSendResult = { ok: true; id: string } | { ok: false; error: string };

const FOOTERS: Record<AppLocale, { unsubscribe: string; footer: string }> = {
  es: {
    unsubscribe: "Si no deseas recibir más emails, <a href=\"{link}\">date de baja aquí</a>.",
    footer: "Vermut El Travieso — vermut premium con espíritu canalla.",
  },
  en: {
    unsubscribe: "If you no longer wish to receive emails, <a href=\"{link}\">unsubscribe here</a>.",
    footer: "El Travieso Vermouth — premium vermouth with a rogue spirit.",
  },
};

function fromAddress() {
  return process.env.MARKETING_FROM_EMAIL ?? "onboarding@resend.dev";
}

export function appendUnsubscribeFooter(
  html: string,
  text: string,
  userId?: string,
  locale: AppLocale = "es",
) {
  if (!userId) return { html, text };
  const link = unsubscribeUrl(userId);
  const copy = FOOTERS[locale] ?? FOOTERS.es;
  return {
    html: `${html}<hr/><p style="font-size:12px;color:#666">${copy.unsubscribe.replace("{link}", link)}</p><p style="font-size:12px;color:#666">${copy.footer}</p>`,
    text: `${text}\n\n${copy.unsubscribe.replace(/<[^>]+>/g, "")}: ${link}\n${copy.footer}`,
  };
}

export async function sendMarketingEmail(input: EmailSendInput): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "test" || process.env.MARKETING_MOCK === "true") {
      return { ok: true, id: `mock-${Date.now()}` };
    }
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const locale = input.locale ?? "es";
  const footer = appendUnsubscribeFooter(input.html, input.text, input.userId, locale);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [input.to],
      subject: input.subject,
      html: footer.html,
      text: footer.text,
    }),
  });

  const payload = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) {
    return { ok: false, error: payload.message ?? `Resend HTTP ${res.status}` };
  }
  return { ok: true, id: payload.id ?? "sent" };
}
