import type { CampaignChannel } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { CampaignAudienceFilter, CampaignRecipient } from "@/lib/marketing/types";

function channelOptInField(channel: CampaignChannel) {
  if (channel === "EMAIL") return "emailOptIn" as const;
  if (channel === "SMS") return "smsOptIn" as const;
  return "whatsappOptIn" as const;
}

export async function upsertMarketingConsent(
  userId: string,
  opts: {
    emailOptIn?: boolean;
    smsOptIn?: boolean;
    whatsappOptIn?: boolean;
    consentSource?: string;
  },
) {
  const now = new Date();
  return prisma.marketingConsent.upsert({
    where: { userId },
    create: {
      userId,
      emailOptIn: opts.emailOptIn ?? false,
      smsOptIn: opts.smsOptIn ?? false,
      whatsappOptIn: opts.whatsappOptIn ?? false,
      consentedAt: now,
      consentSource: opts.consentSource ?? "register",
    },
    update: {
      ...(opts.emailOptIn !== undefined ? { emailOptIn: opts.emailOptIn } : {}),
      ...(opts.smsOptIn !== undefined ? { smsOptIn: opts.smsOptIn } : {}),
      ...(opts.whatsappOptIn !== undefined ? { whatsappOptIn: opts.whatsappOptIn } : {}),
      consentedAt: now,
      consentSource: opts.consentSource ?? "register",
    },
  });
}

export async function resolveCampaignRecipients(
  channel: CampaignChannel,
  audience: CampaignAudienceFilter,
): Promise<CampaignRecipient[]> {
  const optInField = channelOptInField(channel);

  const users = await prisma.user.findMany({
    where: {
      marketingConsent: { [optInField]: true },
      ...(audience.roles?.length ? { role: { in: audience.roles as never[] } } : {}),
    },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      preferredLocale: true,
    },
  });

  return users
    .map((user) => ({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      preferredLocale: user.preferredLocale,
    }))
    .filter((user) => {
      if (channel === "EMAIL") return Boolean(user.email);
      return Boolean(user.phone);
    });
}

export async function revokeEmailOptIn(userId: string) {
  return prisma.marketingConsent.upsert({
    where: { userId },
    create: {
      userId,
      emailOptIn: false,
      smsOptIn: false,
      whatsappOptIn: false,
      consentSource: "unsubscribe",
      consentedAt: new Date(),
    },
    update: {
      emailOptIn: false,
      consentSource: "unsubscribe",
      consentedAt: new Date(),
    },
  });
}
