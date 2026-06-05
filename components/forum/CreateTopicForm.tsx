"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateTopicForm() {
  const { status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "unauthenticated") {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#121212] p-6">
        <p className="text-slate-400">
          <Link href="/login?callbackUrl=/comunidad" className="text-electric-yellow hover:underline">
            Inicia sesión
          </Link>{" "}
          para abrir un nuevo debate.
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return <p className="text-slate-400">Cargando…</p>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/forum/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al publicar");

      router.push(`/comunidad/${data.topic.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-[#121212] p-6 space-y-4">
      <h2 className="text-lg font-bold text-white">Nuevo debate</h2>
      <div>
        <label htmlFor="topic-title" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
          Título
        </label>
        <input
          id="topic-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
          placeholder="¿Qué quieres debatir?"
        />
      </div>
      <div>
        <label htmlFor="topic-content" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
          Mensaje
        </label>
        <textarea
          id="topic-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={5}
          className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
          placeholder="Comparte tu experiencia, duda o recomendación…"
        />
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-widest text-black hover:brightness-110 disabled:opacity-50"
      >
        {saving ? "Publicando…" : "Publicar tema"}
      </button>
    </form>
  );
}
