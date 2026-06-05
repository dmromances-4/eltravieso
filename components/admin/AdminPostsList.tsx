"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminPost = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  updatedAt: string;
  author: { email: string | null; name: string | null } | null;
};

export default function AdminPostsList({ posts }: { posts: AdminPost[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`¿Eliminar "${title}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al eliminar");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  if (posts.length === 0) {
    return <p className="text-slate-400">No hay artículos todavía.</p>;
  }

  return (
    <ul className="space-y-3">
      {posts.map((post) => (
        <li
          key={post.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#121212] px-5 py-4"
        >
          <div>
            <p className="font-semibold text-white">{post.title}</p>
            <p className="mt-1 text-xs text-slate-500">
              {post.author?.name ?? post.author?.email ?? "Sin autor"} ·{" "}
              {post.published ? (
                <span className="text-emerald-400">Publicado</span>
              ) : (
                <span className="text-amber-400">Borrador</span>
              )}{" "}
              · {new Date(post.updatedAt).toLocaleDateString("es-ES")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/blog/${post.slug}`}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-white/40"
            >
              Ver
            </Link>
            <Link
              href={`/admin/posts/${post.id}/edit`}
              className="rounded-full border border-electric-yellow/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-electric-yellow hover:bg-electric-yellow/10"
            >
              Editar
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(post.id, post.title)}
              disabled={deletingId === post.id}
              className="rounded-full border border-red-500/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              {deletingId === post.id ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
