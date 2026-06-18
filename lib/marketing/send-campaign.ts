import type { Campaign, CampaignChannel } from "@prisma/client";
import prisma from "@/lib/prisma";
import { resolveCampaignRecipients } from "@/lib/marketing/consent";
import { sendMarketingEmail } from "@/lib/marketing/email";
import { sendMarketingSms, sendMarketingWhatsApp } from "@/lib/marketing/twilio";
import type { CampaignAudienceFilter, SendCampaignResult } from "@/lib/marketing/types";
import { parseAudience } from "@/lib/marketing/types";

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function recipientForChannel(
  channel: CampaignChannel,
  user: { email: string | null; phone: string | null },
) {
  if (channel === "EMAIL") return user.email;
  return user.phone;
}

async function dispatchMessage(
  campaign: Campaign,
  recipient: string,
  userId: string,
  preferredLocale?: string | null,
  preview = false,
) {
  if (campaign.channel === "EMAIL") {
    const html = campaign.bodyHtml ?? `<p>${campaign.bodyText.replace(/\n/g, "<br/>")}</p>`;
    const locale = preferredLocale === "en" ? "en" : "es";
    return sendMarketingEmail({
      to: recipient,
      subject: campaign.subject ?? campaign.name,
      html: preview ? `[PREVIEW] ${html}` : html,
      text: preview ? `[PREVIEW] ${campaign.bodyText}` : campaign.bodyText,
      userId: preview ? undefined : userId,
      locale,
    });
  }
  if (campaign.channel === "SMS") {
    return sendMarketingSms({ to: recipient, body: preview ? `[PREVIEW] ${campaign.bodyText}` : campaign.bodyText });
  }
  return sendMarketingWhatsApp({ to: recipient, body: preview ? `[PREVIEW] ${campaign.bodyText}` : campaign.bodyText });
}

export async function sendCampaignToRecipients(
  campaign: Campaign,
  recipients: Awaited<ReturnType<typeof resolveCampaignRecipients>>,
  options?: { preview?: boolean },
): Promise<SendCampaignResult> {
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    for (const user of batch) {
      const recipient = recipientForChannel(campaign.channel, user);
      if (!recipient) {
        failed += 1;
        continue;
      }

      let messageId: string | undefined;
      if (!options?.preview) {
        const record = await prisma.campaignMessage.create({
          data: {
            campaignId: campaign.id,
            recipient,
            userId: user.userId,
            status: "QUEUED",
          },
        });
        messageId = record.id;
      }

      const result = await dispatchMessage(
        campaign,
        recipient,
        user.userId,
        user.preferredLocale,
        options?.preview,
      );
      if (result.ok) {
        sent += 1;
        if (messageId) {
          await prisma.campaignMessage.update({
            where: { id: messageId },
            data: { status: "SENT", providerId: result.id, sentAt: new Date() },
          });
        }
      } else {
        failed += 1;
        if (messageId) {
          await prisma.campaignMessage.update({
            where: { id: messageId },
            data: { status: "FAILED", error: result.error },
          });
        }
      }
    }
    if (i + BATCH_SIZE < recipients.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return { sent, failed, total: recipients.length };
}

export async function runCampaignSend(campaignId: string, options?: { previewUserId?: string }) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error("Campaña no encontrada");
  if (campaign.status === "SENDING") throw new Error("La campaña ya se está enviando");

  let recipients: Awaited<ReturnType<typeof resolveCampaignRecipients>>;

  if (options?.previewUserId) {
    const user = await prisma.user.findUnique({
      where: { id: options.previewUserId },
      select: { id: true, email: true, phone: true, name: true, preferredLocale: true },
    });
    if (!user) throw new Error("Usuario no encontrado");
    recipients = [
      {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        preferredLocale: user.preferredLocale,
      },
    ];
    return sendCampaignToRecipients(campaign, recipients, { preview: true });
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "SENDING" },
  });

  recipients = await resolveCampaignRecipients(
    campaign.channel,
    parseAudience(campaign.audience) as CampaignAudienceFilter,
  );

  const result = await sendCampaignToRecipients(campaign, recipients);

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: result.failed === result.total && result.total > 0 ? "FAILED" : "SENT",
      sentAt: new Date(),
    },
  });

  return result;
}
