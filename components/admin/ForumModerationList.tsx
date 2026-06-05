"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TopicRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  isPinned: boolean;
  authorName: string | null;
  commentCount: number;
  updatedAt: string;
};

type ForumModerationListProps = {
  topics: TopicRow[];
};

export default function ForumModerationList({ topics }: ForumModerationListProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const moderate = async (id: string, payload: { status?: string; isPinned?: boolean }) => {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/forum/topics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setMessage(json.message);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {message ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-[#121212] text-xs uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-4 py-3">Tema</th>
              <th className="px-4 py-3">Autor</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Comentarios</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => (
              <tr key={topic.id} className="border-b border-white/5 bg-[#0f0f0f]">
                <td className="px-4 py-3 text-white">{topic.title}</td>
                <td className="px-4 py-3 text-slate-400">{topic.authorName ?? "—"}</td>
                <td className="px-4 py-3 text-slate-400">
                  {topic.status}
                  {topic.isPinned ? " · fijado" : ""}
                </td>
                <td className="px-4 py-3 text-slate-400">{topic.commentCount}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === topic.id}
                      onClick={() => moderate(topic.id, { status: "PINNED", isPinned: true })}
                      className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white disabled:opacity-50"
                    >
                      Fijar
                    </button>
                    <button
                      type="button"
                      disabled={busyId === topic.id}
                      onClick={() => moderate(topic.id, { status: "OPEN", isPinned: false })}
                      className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white disabled:opacity-50"
                    >
                      Abrir
                    </button>
                    <button
                      type="button"
                      disabled={busyId === topic.id}
                      onClick={() => moderate(topic.id, { status: "CLOSED" })}
                      className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white disabled:opacity-50"
                    >
                      Cerrar
                    </button>
                    <button
                      type="button"
                      disabled={busyId === topic.id}
                      onClick={() => moderate(topic.id, { status: "ARCHIVED" })}
                      className="rounded-full border border-red-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-300 disabled:opacity-50"
                    >
                      Archivar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
