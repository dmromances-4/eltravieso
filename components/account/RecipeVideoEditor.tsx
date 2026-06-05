"use client";

import { useState } from "react";

export default function RecipeVideoEditor({
  recipeId,
  initialUrl,
}: {
  recipeId: string;
  initialUrl: string | null;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  async function save() {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch(`/api/user/recipes/${recipeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: url }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Vídeo-tutorial (YouTube, Vimeo o MP4)
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setStatus("idle");
          }}
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-electric-yellow focus:outline-none"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-electric-yellow px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:brightness-110 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar vídeo"}
        </button>
      </div>
      {status === "saved" && (
        <p className="mt-2 text-xs font-semibold text-electric-yellow">Vídeo guardado.</p>
      )}
      {status === "error" && (
        <p className="mt-2 text-xs font-semibold text-electric-red">No se pudo guardar.</p>
      )}
    </div>
  );
}
