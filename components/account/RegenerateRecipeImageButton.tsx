"use client";

import { useState } from "react";

export default function RegenerateRecipeImageButton({
  recipeId,
  slug,
}: {
  recipeId: string;
  slug: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function regenerate() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/user/recipes/${recipeId}/image`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      setMessage(`Imagen regenerada: ${slug}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al regenerar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <button
        type="button"
        onClick={regenerate}
        disabled={loading}
        className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-electric-yellow hover:text-electric-yellow disabled:opacity-50"
      >
        {loading ? "Generando imagen…" : "Regenerar imagen IA"}
      </button>
      {message ? <p className="mt-2 text-xs text-slate-500">{message}</p> : null}
    </div>
  );
}
