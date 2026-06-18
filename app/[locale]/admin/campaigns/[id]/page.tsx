import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { CampaignActions } from "@/components/admin/CampaignAdmin";

export const dynamic = "force-dynamic";

export default async function AdminCampaignDetailPage({ params }: { params: { id: string } }) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { messages: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!campaign) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/campaigns" className="text-sm text-slate-400 hover:text-electric-yellow">
          ← Campañas
        </Link>
        <h1 className="mt-4 text-4xl font-display font-bold tracking-tight text-white">{campaign.name}</h1>
        <p className="mt-2 text-slate-400">
          {campaign.channel} · {campaign.status} · {campaign._count.messages} mensajes
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 space-y-4">
        {campaign.subject ? (
          <p>
            <span className="text-xs uppercase tracking-widest text-slate-500">Asunto</span>
            <br />
            <span className="text-white">{campaign.subject}</span>
          </p>
        ) : null}
        <p>
          <span className="text-xs uppercase tracking-widest text-slate-500">Cuerpo</span>
          <br />
          <span className="text-slate-300 whitespace-pre-wrap">{campaign.bodyText}</span>
        </p>
      </div>

      <CampaignActions campaignId={campaign.id} status={campaign.status} />

      {campaign.messages.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">Últimos envíos</h2>
          <ul className="space-y-2">
            {campaign.messages.map((msg) => (
              <li key={msg.id} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-400">
                {msg.recipient} · {msg.status}
                {msg.error ? ` · ${msg.error}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
