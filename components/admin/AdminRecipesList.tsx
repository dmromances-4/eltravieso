"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminRecipe = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  updatedAt: string;
  author: { email: string | null; name: string | null } | null;
};

export default function AdminRecipesList({ recipes }: { recipes: AdminRecipe[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`¿Eliminar "${title}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/recipes/${id}`, { method: "DELETE" });
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

  if (recipes.length === 0) {
    return <p className="text-slate-400">No hay recetas en la base de datos.</p>;
  }

  return (
    <ul className="space-y-3">
      {recipes.map((recipe) => (
        <li
          key={recipe.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#121212] px-5 py-4"
        >
          <div>
            <p className="font-semibold text-white">{recipe.title}</p>
            <p className="mt-1 text-xs text-slate-500">
              {recipe.author?.name ?? recipe.author?.email ?? "Sin autor"} · {recipe.slug} ·{" "}
              {recipe.isPublished ? (
                <span className="text-emerald-400">Publicada</span>
              ) : (
                <span className="text-amber-400">Oculta</span>
              )}{" "}
              · {new Date(recipe.updatedAt).toLocaleDateString("es-ES")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/recetas/${recipe.slug}`}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-white/40"
            >
              Ver
            </Link>
            <Link
              href={`/admin/recipes/${recipe.id}/edit`}
              className="rounded-full border border-electric-yellow/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-electric-yellow hover:bg-electric-yellow/10"
            >
              Editar
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(recipe.id, recipe.title)}
              disabled={deletingId === recipe.id}
              className="rounded-full border border-red-500/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              {deletingId === recipe.id ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
