"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BarEventosPage() {
  const [items, setItems] = useState<Array<{ id: string; title: string; slug: string; status: string }>>([]);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/bar/media");
    const data = await res.json();
    setItems(data.items ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const uploadVideo = async (file: File) => {
    const form = new FormData();
    form.append("video", file);
    const res = await fetch("/api/media/upload/video", { method: "POST", body: form });
    const data = await res.json();
    if (res.ok) setMediaUrl(data.mediaUrl);
    else setMessage(data.message ?? "Error subida");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/bar/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, summary, mediaUrl, sourceType: mediaUrl.startsWith("/") ? "UPLOAD" : "EMBED" }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage("Evento enviado a revisión editorial.");
      setTitle("");
      setSummary("");
      setMediaUrl("");
      load();
    } else {
      setMessage(data.message ?? "Error");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mono text-3xl font-bold uppercase tracking-widest text-white">Eventos en vídeo</h1>
        <p className="mt-2 text-sm text-slate-400">Publica actividades de tu bar. El equipo revisará antes de aparecer en Pantalla.</p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-[2rem] border border-white/10 bg-[#111111]/90 p-6">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del evento" required className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white" />
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Descripción" rows={3} className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white" />
        <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="URL YouTube/Vimeo o vídeo subido" className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white" />
        <input type="file" accept="video/mp4,video/webm" onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0])} className="text-sm text-slate-400" />
        {message ? <p className="text-sm text-amber-300">{message}</p> : null}
        <button type="submit" disabled={loading} className="rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50">
          Enviar a revisión
        </button>
      </form>

      <section>
        <h2 className="mb-4 font-bold text-white">Mis eventos</h2>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm">
              <span>{item.title}</span>
              <span className="text-slate-500">{item.status}</span>
            </li>
          ))}
        </ul>
      </section>

      <Link href="/cuenta/bar" className="text-sm text-electric-yellow underline">← Mi local</Link>
    </div>
  );
}
