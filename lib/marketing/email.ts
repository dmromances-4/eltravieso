import { unsubscribeUrl } from "@/lib/marketing/unsubscribe";

export type EmailSendInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  userId?: string;
};

export type EmailSendResult = { ok: true; id: string } | { ok: false; error: string };

function fromAddress() {
  return process.env.MARKETING_FROM_EMAIL ?? "onboarding@resend.dev";
}

export function appendUnsubscribeFooter(html: string, text: string, userId?: string) {
  if (!userId) return { html, text };
  const link = unsubscribeUrl(userId);
  return {
    html: `${html}<hr/><p style="font-size:12px;color:#666">Si no deseas recibir más emails, <a href="${link}">date de baja aquí</a>.</p>`,
    text: `${text}\n\nDarse de baja: ${link}`,
  };
}

export async function sendMarketingEmail(input: EmailSendInput): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "test" || process.env.MARKETING_MOCK === "true") {
      return { ok: true, id: `mock-${Date.now()}` };
    }
    return { ok: false, error: "RESEND_API_KEY no configurada" };
  }

  const footer = appendUnsubscribeFooter(input.html, input.text, input.userId);

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
