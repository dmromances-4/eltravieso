"use client";

import { useSession } from "next-auth/react";
import { Link, useRouter } from "@/i18n/navigation";
import { useState } from "react";

type CommentFormProps = {
  topicSlug: string;
};

export default function CommentForm({ topicSlug }: CommentFormProps) {
  const { status } = useSession();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "unauthenticated") {
    return (
      <p className="text-sm text-slate-400">
        <Link href={`/login?callbackUrl=/comunidad/${topicSlug}`} className="text-electric-yellow hover:underline">
          Inicia sesión
        </Link>{" "}
        para responder.
      </p>
    );
  }

  if (status === "loading") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/forum/topics/${topicSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al publicar");

      setContent("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-[#121212] p-5 space-y-3">
      <label htmlFor="comment-content" className="block text-xs font-bold uppercase tracking-widest text-slate-400">
        Tu respuesta
      </label>
      <textarea
        id="comment-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={4}
        className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
        placeholder="Escribe tu comentario…"
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded-full border border-electric-yellow/40 px-5 py-2 text-xs font-bold uppercase tracking-widest text-electric-yellow hover:bg-electric-yellow/10 disabled:opacity-50"
      >
        {saving ? "Enviando…" : "Responder"}
      </button>
    </form>
  );
}
