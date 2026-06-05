export type SmsSendInput = {
  to: string;
  body: string;
};

export type ChannelSendResult = { ok: true; id: string } | { ok: false; error: string };

function twilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
  return { accountSid, authToken, messagingServiceSid, whatsappFrom };
}

async function twilioPost(path: string, params: Record<string, string>): Promise<ChannelSendResult> {
  const { accountSid, authToken } = twilioConfig();
  if (!accountSid || !authToken) {
    if (process.env.NODE_ENV === "test" || process.env.MARKETING_MOCK === "true") {
      return { ok: true, id: `mock-twilio-${Date.now()}` };
    }
    return { ok: false, error: "Twilio no configurado" };
  }

  const body = new URLSearchParams(params);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
  if (!res.ok) {
    return { ok: false, error: payload.message ?? `Twilio HTTP ${res.status}` };
  }
  return { ok: true, id: payload.sid ?? "sent" };
}

export async function sendMarketingSms(input: SmsSendInput): Promise<ChannelSendResult> {
  const { messagingServiceSid } = twilioConfig();
  if (!messagingServiceSid) {
    if (process.env.NODE_ENV === "test" || process.env.MARKETING_MOCK === "true") {
      return { ok: true, id: `mock-sms-${Date.now()}` };
    }
    return { ok: false, error: "TWILIO_MESSAGING_SERVICE_SID no configurado" };
  }

  return twilioPost("/Messages.json", {
    To: input.to,
    MessagingServiceSid: messagingServiceSid,
    Body: input.body,
  });
}

export async function sendMarketingWhatsApp(input: SmsSendInput): Promise<ChannelSendResult> {
  const { whatsappFrom } = twilioConfig();
  if (!whatsappFrom) {
    if (process.env.NODE_ENV === "test" || process.env.MARKETING_MOCK === "true") {
      return { ok: true, id: `mock-wa-${Date.now()}` };
    }
    return { ok: false, error: "TWILIO_WHATSAPP_FROM no configurado" };
  }

  const to = input.to.startsWith("whatsapp:") ? input.to : `whatsapp:${input.to}`;
  return twilioPost("/Messages.json", {
    From: whatsappFrom.startsWith("whatsapp:") ? whatsappFrom : `whatsapp:${whatsappFrom}`,
    To: to,
    Body: input.body,
  });
}
