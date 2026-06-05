import Link from "next/link";
import prisma from "@/lib/prisma";
import CampaignList from "@/components/admin/CampaignAdmin";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });

  const mapped = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    channel: c.channel,
    status: c.status,
    subject: c.subject,
    sentAt: c.sentAt?.toISOString() ?? null,
    updatedAt: c.updatedAt.toISOString(),
    messageCount: c._count.messages,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-white">Campañas</h1>
          <p className="mt-2 text-slate-400">Email, SMS y WhatsApp a usuarios con consentimiento.</p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="rounded-full bg-red-600 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-red-500"
        >
          Nueva campaña
        </Link>
      </div>
      <CampaignList campaigns={mapped} />
    </div>
  );
}
