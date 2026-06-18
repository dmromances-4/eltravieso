"use client";

import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";

type BlogPostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverUrl: string | null;
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

export default function UserBlogList() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then((res) => res.json())
      .then((data) => setPosts(data.posts ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Mis artículos</h1>
          <p className="mt-2 text-slate-400">Crea y publica contenido en el blog público.</p>
        </div>
        <Link
          href="/cuenta/blog/nuevo"
          className="rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:brightness-110"
        >
          Crear post
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-400">Cargando…</p>
      ) : posts.length === 0 ? (
        <div className="rounded-[2rem] border border-white/10 bg-[#121212] p-10 text-center">
          <p className="text-slate-400">Aún no has publicado ningún artículo.</p>
          <Link href="/cuenta/blog/nuevo" className="mt-4 inline-block text-sm font-bold text-electric-yellow">
            Escribir el primero →
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li
              key={post.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#121212] p-6"
            >
              <div>
                <h2 className="text-lg font-bold text-white">{post.title}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {post.published ? "Publicado" : "Borrador"} ·{" "}
                  {new Date(post.publishedAt ?? post.updatedAt).toLocaleDateString("es-ES")}
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/blog/${post.slug}`}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-electric-yellow hover:text-electric-yellow"
                >
                  Ver
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
