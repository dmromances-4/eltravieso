"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useSession } from "next-auth/react";

type AvatarUploadProps = {
  imageUrl: string | null;
  name: string;
  onUpdated: (url: string | null) => void;
};

export default function AvatarUpload({ imageUrl, name, onUpdated }: AvatarUploadProps) {
  const { update } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(imageUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const displayUrl = preview || imageUrl;
  const initial = (name || "U").charAt(0).toUpperCase();

  const handleFile = async (file: File) => {
    setLoading(true);
    setError("");

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/user/avatar", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "No se pudo subir la foto");
      }

      setPreview(data.imageUrl);
      onUpdated(data.imageUrl);
      await update({ image: data.imageUrl });
      URL.revokeObjectURL(objectUrl);
    } catch (err: unknown) {
      setPreview(imageUrl);
      URL.revokeObjectURL(objectUrl);
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/avatar", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo eliminar la foto");

      setPreview(null);
      onUpdated(null);
      await update({ image: null });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-electric-yellow/30 bg-[#0f0f0f]">
        {displayUrl ? (
          <Image src={displayUrl} alt={name} fill className="object-cover" sizes="112px" unoptimized />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-electric-yellow">{initial}</span>
        )}
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-electric-yellow border-t-transparent" />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 text-center sm:text-left">
        <p className="text-sm font-semibold text-white">Fotografía de perfil</p>
        <p className="text-xs text-slate-500">JPG, PNG, WebP o GIF · máximo 5 MB</p>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="rounded-full bg-electric-yellow px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-black hover:brightness-110 disabled:opacity-60"
          >
            Subir foto
          </button>
          {displayUrl ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleRemove}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-400 hover:text-white disabled:opacity-60"
            >
              Quitar
            </button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
