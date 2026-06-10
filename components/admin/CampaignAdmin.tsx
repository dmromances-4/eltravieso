"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminCampaign = {
  id: string;
  name: string;
  channel: string;
  status: string;
  subject: string | null;
  sentAt: string | null;
  updatedAt: string;
  messageCount: number;
};

const statusLabel: Record<string, string> = {
  DRAFT: "Borrador",
  SCHEDULED: "Programada",
  SENDING: "Enviando",
  SENT: "Enviada",
  FAILED: "Fallida",
};

export default function CampaignList({ campaigns }: { campaigns: AdminCampaign[] }) {
  if (campaigns.length === 0) {
    return <p className="text-slate-400">No hay campañas todavía.</p>;
  }

  return (
    <ul className="space-y-3">
      {campaigns.map((campaign) => (
        <li
          key={campaign.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#121212] px-5 py-4"
        >
          <div>
            <p className="font-semibold text-white">{campaign.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {campaign.channel} · {statusLabel[campaign.status] ?? campaign.status} · {campaign.messageCount} mensajes ·{" "}
              {new Date(campaign.updatedAt).toLocaleDateString("es-ES")}
            </p>
          </div>
          <Link
            href={`/admin/campaigns/${campaign.id}`}
            className="rounded-full border border-electric-yellow/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-electric-yellow hover:bg-electric-yellow/10"
          >
            Gestionar
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function CampaignForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("EMAIL");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          channel,
          subject: channel === "EMAIL" ? subject : null,
          bodyText,
          bodyHtml: channel === "EMAIL" ? bodyHtml || null : null,
          audience: {},
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error creando campaña");
      router.push(`/admin/campaigns/${data.campaign.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {error ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div> : null}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-300">Nombre</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-white"
        />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-300">Canal</label>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-white"
        >
          <option value="EMAIL">Email</option>
          <option value="SMS">SMS</option>
          <option value="WHATSAPP">WhatsApp</option>
        </select>
      </div>
      {channel === "EMAIL" ? (
        <>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-300">Asunto</label>
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-300">HTML (opcional)</label>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-white"
            />
          </div>
        </>
      ) : null}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-300">Cuerpo</label>
        <textarea
          required
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={6}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-white"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50"
      >
        {loading ? "Creando…" : "Crear borrador"}
      </button>
    </form>
  );
}

export function CampaignActions({ campaignId, status }: { campaignId: string; status: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<"preview" | "send" | null>(null);

  const run = async (action: "preview" | "send") => {
    if (action === "send" && !window.confirm("¿Enviar campaña a todos los usuarios con opt-in?")) return;
    setLoading(action);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      setMessage(`${data.message} Enviados: ${data.result?.sent ?? 0}, fallidos: ${data.result?.failed ?? 0}`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-slate-300">{message}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => run("preview")}
          disabled={loading !== null}
          className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
        >
          {loading === "preview" ? "Enviando preview…" : "Preview al admin"}
        </button>
        <button
          type="button"
          onClick={() => run("send")}
          disabled={loading !== null || status === "SENT" || status === "SENDING"}
          className="rounded-full bg-electric-red px-5 py-2 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
        >
          {loading === "send" ? "Enviando…" : "Enviar campaña"}
        </button>
      </div>
    </div>
  );
}
