import type { CampaignChannel, Prisma } from "@prisma/client";

export type CampaignAudienceFilter = {
  roles?: string[];
};

export type CampaignRecipient = {
  userId: string;
  email: string | null;
  phone: string | null;
  name: string | null;
};

export type SendCampaignResult = {
  sent: number;
  failed: number;
  total: number;
};

export function parseAudience(raw: unknown): CampaignAudienceFilter {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const roles = Array.isArray(obj.roles)
    ? obj.roles.filter((r): r is string => typeof r === "string")
    : undefined;
  return roles?.length ? { roles } : {};
}

export function campaignChannelRequiresSubject(channel: CampaignChannel) {
  return channel === "EMAIL";
}

export type CreateCampaignInput = {
  name: string;
  channel: CampaignChannel;
  subject?: string | null;
  bodyHtml?: string | null;
  bodyText: string;
  audience?: CampaignAudienceFilter;
};

export function validateCreateCampaignInput(body: unknown): CreateCampaignInput | string {
  if (!body || typeof body !== "object") return "Cuerpo inválido";
  const obj = body as Record<string, unknown>;
  const name = String(obj.name ?? "").trim();
  const channel = String(obj.channel ?? "").toUpperCase();
  const bodyText = String(obj.bodyText ?? "").trim();
  const subject = obj.subject != null ? String(obj.subject).trim() : null;
  const bodyHtml = obj.bodyHtml != null ? String(obj.bodyHtml) : null;

  if (!name) return "El nombre es obligatorio";
  if (!["EMAIL", "SMS", "WHATSAPP"].includes(channel)) return "Canal no válido";
  if (!bodyText) return "El cuerpo del mensaje es obligatorio";
  if (channel === "EMAIL" && !subject) return "El asunto es obligatorio para email";

  return {
    name,
    channel: channel as CampaignChannel,
    subject,
    bodyHtml,
    bodyText,
    audience: parseAudience(obj.audience),
  };
}

export function serializeCampaign(campaign: Prisma.CampaignGetPayload<{ include: { _count: { select: { messages: true } } } }>) {
  return {
    id: campaign.id,
    name: campaign.name,
    channel: campaign.channel,
    status: campaign.status,
    subject: campaign.subject,
    bodyText: campaign.bodyText,
    bodyHtml: campaign.bodyHtml,
    audience: campaign.audience,
    scheduledAt: campaign.scheduledAt?.toISOString() ?? null,
    sentAt: campaign.sentAt?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
    messageCount: campaign._count.messages,
  };
}
