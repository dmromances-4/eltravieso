"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; imageUrl: string | null };
  replies?: Comment[];
};

export default function MediaComments({ slug }: { slug: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/media/${slug}/comments`);
    const data = await res.json();
    setComments(data.comments ?? []);
    setLoaded(true);
  };

  if (!loaded) {
    return (
      <button type="button" onClick={load} className="text-sm text-electric-yellow underline">
        Cargar comentarios
      </button>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/media/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [data.comment, ...prev]);
        setContent("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-white">Comentarios</h2>
      {session?.user ? (
        <form onSubmit={submit} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Tu opinión..."
            className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white"
          />
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="rounded-full bg-electric-yellow px-5 py-2 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50"
          >
            Publicar
          </button>
        </form>
      ) : (
        <p className="text-sm text-slate-400">Inicia sesión para comentar.</p>
      )}
      <ul className="space-y-4">
        {comments.map((c) => (
          <li key={c.id} className="rounded-2xl border border-white/10 bg-[#121212] p-4">
            <p className="text-sm font-semibold text-white">{c.author.name ?? "Usuario"}</p>
            <p className="mt-2 text-slate-300">{c.content}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
