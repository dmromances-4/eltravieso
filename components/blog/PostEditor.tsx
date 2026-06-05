"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

type PostEditorProps = {
  postId?: string;
  initialTitle?: string;
  initialContent?: string;
  initialCoverUrl?: string | null;
  initialIsPremium?: boolean;
  allowPremiumToggle?: boolean;
  redirectPath?: string;
};

export default function PostEditor({
  postId,
  initialTitle = "",
  initialContent = "",
  initialCoverUrl = null,
  initialIsPremium = false,
  allowPremiumToggle = false,
  redirectPath = "/cuenta/blog",
}: PostEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl);
  const [isPremium, setIsPremium] = useState(initialIsPremium);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-electric-yellow underline" } }),
    ],
    content: initialContent || "<p>Escribe tu artículo aquí…</p>",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[280px] rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 focus:outline-none",
      },
    },
  });

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("cover", file);
      const res = await fetch("/api/blog/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al subir la portada");
      setCoverUrl(data.coverUrl);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error al subir" });
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      setMessage({ type: "error", text: "El título es obligatorio." });
      return;
    }
    const content = editor?.getHTML() ?? "";
    if (!content.replace(/<[^>]+>/g, "").trim()) {
      setMessage({ type: "error", text: "El contenido no puede estar vacío." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const url = postId ? `/api/blog/${postId}` : "/api/blog";
      const method = postId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          coverUrl,
          ...(allowPremiumToggle ? { isPremium } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al publicar");

      setMessage({ type: "success", text: data.message || "Publicado" });
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error al publicar" });
    } finally {
      setSaving(false);
    }
  };

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL del enlace", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="space-y-8">
      <div>
        <label htmlFor="post-title" className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
          Título
        </label>
        <input
          id="post-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#0a0a0a] px-5 py-4 text-lg font-semibold text-white focus:border-electric-yellow focus:outline-none"
          placeholder="Título del artículo"
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Imagen de portada</p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="cursor-pointer rounded-full border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:border-electric-yellow hover:text-electric-yellow">
            {uploading ? "Subiendo…" : "Subir imagen"}
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploading} />
          </label>
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="Portada" className="h-24 w-40 rounded-xl border border-white/10 object-cover" />
          ) : null}
        </div>
      </div>

      {allowPremiumToggle ? (
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-electric-red/30 bg-electric-red/5 px-5 py-4">
          <input
            type="checkbox"
            checked={isPremium}
            onChange={(e) => setIsPremium(e.target.checked)}
            className="h-4 w-4 rounded border-white/20"
          />
          <span className="text-sm font-bold uppercase tracking-widest text-electric-red">
            Contenido Club VIP
          </span>
        </label>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Contenido</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {[
            { label: "Negrita", action: () => editor?.chain().focus().toggleBold().run() },
            { label: "Cursiva", action: () => editor?.chain().focus().toggleItalic().run() },
            { label: "H2", action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
            { label: "Lista", action: () => editor?.chain().focus().toggleBulletList().run() },
            { label: "Enlace", action: setLink },
          ].map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.action}
              className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-electric-yellow hover:text-electric-yellow"
            >
              {btn.label}
            </button>
          ))}
        </div>
        <EditorContent editor={editor} />
      </div>

      {message ? (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/40 bg-red-500/10 text-red-200"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handlePublish}
        disabled={saving}
        className="rounded-full bg-electric-yellow px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-black transition hover:brightness-110 disabled:opacity-50"
      >
        {saving ? "Publicando…" : "Publicar"}
      </button>
    </div>
  );
}
