import prisma from "@/lib/prisma";

export async function markWebhookProcessed(eventId: string, source: string): Promise<boolean> {
  try {
    await prisma.processedWebhook.create({
      data: { eventId, source },
    });
    return true;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "P2002") return false;
    throw error;
  }
}

export async function isWebhookProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.processedWebhook.findUnique({
    where: { eventId },
  });
  return Boolean(existing);
}

export function buildWebhookEventId(source: string, eventId: string): string {
  return `${source}:${eventId}`;
}
