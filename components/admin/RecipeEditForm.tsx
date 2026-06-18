"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

type RecipeEditFormProps = {
  recipe?: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    glass: string | null;
    ingredients: string;
    method: string | null;
    imageUrl: string | null;
    isPublished: boolean;
    isPremium: boolean;
  };
};

export default function RecipeEditForm({ recipe }: RecipeEditFormProps) {
  const router = useRouter();
  const isNew = !recipe;
  const [title, setTitle] = useState(recipe?.title ?? "");
  const [summary, setSummary] = useState(recipe?.summary ?? "");
  const [glass, setGlass] = useState(recipe?.glass ?? "");
  const [ingredients, setIngredients] = useState(recipe?.ingredients ?? "");
  const [method, setMethod] = useState(recipe?.method ?? "");
  const [imageUrl, setImageUrl] = useState(recipe?.imageUrl ?? "");
  const [isPublished, setIsPublished] = useState(recipe?.isPublished ?? true);
  const [isPremium, setIsPremium] = useState(recipe?.isPremium ?? false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const url = isNew ? "/api/admin/recipes" : `/api/admin/recipes/${recipe.id}`;
      const methodHttp = isNew ? "POST" : "PATCH";
      const res = await fetch(url, {
        method: methodHttp,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          glass,
          ingredients,
          method,
          imageUrl: imageUrl || null,
          isPublished,
          isPremium,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar");

      if (isNew && data.recipe?.id) {
        router.push(`/admin/recipes/${data.recipe.id}/edit`);
      } else {
        setMessage("Receta guardada.");
        router.refresh();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <label htmlFor="title" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
          Título
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
        />
      </div>

      {recipe ? (
        <p className="text-sm text-slate-500">
          Slug: {recipe.slug} ·{" "}
          <a href={`/recetas/${recipe.slug}`} className="text-electric-yellow hover:underline">
            Ver en catálogo
          </a>
        </p>
      ) : null}

      <div>
        <label htmlFor="summary" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
          Resumen
        </label>
        <textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="glass" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
          Vaso
        </label>
        <input
          id="glass"
          value={glass}
          onChange={(e) => setGlass(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="ingredients" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
          Ingredientes (uno por línea)
        </label>
        <textarea
          id="ingredients"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          required
          rows={6}
          className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 font-mono text-sm text-white focus:border-electric-yellow focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="method" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
          Preparación (un paso por línea)
        </label>
        <textarea
          id="method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          rows={6}
          className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="imageUrl" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
          URL de portada
        </label>
        <input
          id="imageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
        />
      </div>

      <label className="flex items-center gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={isPremium}
          onChange={(e) => setIsPremium(e.target.checked)}
          className="h-4 w-4 rounded border-white/20"
        />
        Contenido Club VIP (ficha técnica premium)
      </label>

      <label className="flex items-center gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="h-4 w-4 rounded border-white/20"
        />
        Publicada en catálogo
      </label>

      {message ? <p className="text-sm text-electric-yellow">{message}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-electric-yellow px-8 py-3 text-xs font-bold uppercase tracking-widest text-black hover:brightness-110 disabled:opacity-50"
      >
        {saving ? "Guardando…" : isNew ? "Crear receta" : "Guardar cambios"}
      </button>
    </form>
  );
}
