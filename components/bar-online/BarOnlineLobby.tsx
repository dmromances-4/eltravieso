"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type SessionType = "CHAT" | "VIDEO_CALL" | "TASTING_EVENT";

interface BarOnlineSessionDTO {
  id: string;
  title: string;
  description: string | null;
  type: SessionType;
  roomId: string | null;
  maxUsers: number;
  scheduledAt: string | null;
  host: { id: string; name: string | null };
  _count: { participants: number };
}

const TYPE_LABELS: Record<SessionType, string> = {
  CHAT: "Chat",
  VIDEO_CALL: "Videollamada",
  TASTING_EVENT: "Cata en directo",
};

export default function BarOnlineLobby({ canCreate }: { canCreate: boolean }) {
  const [sessions, setSessions] = useState<BarOnlineSessionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "CHAT" as SessionType,
    maxUsers: 10,
  });

  async function loadSessions() {
    try {
      const res = await fetch("/api/bar-online", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setSessions(data.sessions ?? []);
    } catch {
      setError("No se pudieron cargar las sesiones.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/bar-online", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Error al crear la sesión.");
      } else {
        setForm({ title: "", description: "", type: "CHAT", maxUsers: 10 });
        await loadSessions();
      }
    } catch {
      setError("Error de red al crear la sesión.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-12 font-mono">
      {canCreate && (
        <form
          onSubmit={handleCreate}
          className="border-4 border-black bg-zinc-900 p-6 shadow-[6px_6px_0px_#000000]"
        >
          <h2 className="mb-6 border-b-4 border-black pb-2 text-xl font-bold uppercase tracking-wider text-electric-yellow">
            Abrir una sala
          </h2>
          {error && (
            <div className="mb-4 border-4 border-black bg-electric-red p-3 font-bold text-white shadow-[4px_4px_0px_#000000]">
              {error}
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Título *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border-4 border-black bg-black px-4 py-3 text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Descripción
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border-4 border-black bg-black px-4 py-3 text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Tipo
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as SessionType })
                }
                className="w-full border-4 border-black bg-black px-4 py-3 text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
              >
                <option value="CHAT">Chat</option>
                <option value="VIDEO_CALL">Videollamada</option>
                <option value="TASTING_EVENT">Cata en directo</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Aforo máximo
              </label>
              <input
                type="number"
                min={2}
                value={form.maxUsers}
                onChange={(e) =>
                  setForm({ ...form, maxUsers: Number(e.target.value) })
                }
                className="w-full border-4 border-black bg-black px-4 py-3 text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="border-4 border-black bg-electric-yellow px-6 py-3 text-sm font-bold uppercase tracking-widest text-black shadow-[4px_4px_0px_#000000] transition-all hover:bg-white active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#000000] disabled:opacity-50"
            >
              {creating ? "Abriendo..." : "Abrir sala"}
            </button>
          </div>
        </form>
      )}

      <div>
        <h2 className="mb-6 text-xl font-bold uppercase tracking-wider text-white">
          Salas activas
        </h2>
        {loading ? (
          <p className="animate-pulse uppercase tracking-widest text-electric-yellow">
            Cargando salas...
          </p>
        ) : sessions.length === 0 ? (
          <p className="border-4 border-black bg-zinc-900 p-6 text-slate-400 shadow-[4px_4px_0px_#000000]">
            No hay salas abiertas ahora mismo. {canCreate ? "Abre la primera." : ""}
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={s.roomId ? `/bar-online/${s.roomId}` : "#"}
                className="group border-4 border-black bg-zinc-900 p-6 shadow-[6px_6px_0px_#000000] transition-all hover:-translate-y-1 hover:border-electric-yellow"
              >
                <span className="inline-block border-2 border-black bg-electric-blue px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
                  {TYPE_LABELS[s.type]}
                </span>
                <h3 className="mt-4 text-lg font-bold uppercase tracking-wide text-white group-hover:text-electric-yellow">
                  {s.title}
                </h3>
                {s.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                    {s.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between border-t-2 border-black/40 pt-4 text-xs text-slate-400">
                  <span>Anfitrión: {s.host.name ?? "Anónimo"}</span>
                  <span className="font-bold text-electric-yellow">
                    {s._count.participants}/{s.maxUsers}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
