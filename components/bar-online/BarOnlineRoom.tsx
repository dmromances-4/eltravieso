"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useBarOnline, type RtcSignal } from "@/lib/realtime/useBarOnline";

type SessionType = "CHAT" | "VIDEO_CALL" | "TASTING_EVENT";

interface BarOnlineRoomProps {
  roomId: string;
  title: string;
  type: SessionType;
  currentUserId: string;
}

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const STATUS_LABEL: Record<string, string> = {
  connecting: "Conectando",
  connected: "En directo",
  error: "Error de conexión",
  disconnected: "Desconectado",
};

export default function BarOnlineRoom({
  roomId,
  title,
  type,
  currentUserId,
}: BarOnlineRoomProps) {
  const { status, members, messages, sendMessage, sendSignal, onSignal } =
    useBarOnline(roomId);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isVideo = type === "VIDEO_CALL" || type === "TASTING_EVENT";

  // ── WebRTC mesh ──
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>(
    {}
  );
  const [mediaError, setMediaError] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Acquire local media for video sessions.
  useEffect(() => {
    if (!isVideo) return;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      })
      .catch(() => setMediaError("No se pudo acceder a la cámara/micrófono."));

    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
  }, [isVideo]);

  function createPeer(remoteId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(remoteId, { kind: "candidate", candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      setRemoteStreams((prev) => ({ ...prev, [remoteId]: stream }));
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "closed" ||
        pc.connectionState === "disconnected"
      ) {
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[remoteId];
          return next;
        });
      }
    };

    peersRef.current.set(remoteId, pc);
    return pc;
  }

  // Establish peer connections when membership changes (deterministic initiator).
  useEffect(() => {
    if (!isVideo || status !== "connected") return;

    const otherIds = members
      .map((m) => m.userId)
      .filter((id) => id !== currentUserId);

    // Create offers to peers where we are the deterministic initiator.
    otherIds.forEach(async (remoteId) => {
      if (peersRef.current.has(remoteId)) return;
      if (currentUserId < remoteId) {
        const pc = createPeer(remoteId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal(remoteId, { kind: "offer", sdp: pc.localDescription });
      }
    });

    // Tear down peers that left.
    peersRef.current.forEach((pc, remoteId) => {
      if (!otherIds.includes(remoteId)) {
        pc.close();
        peersRef.current.delete(remoteId);
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[remoteId];
          return next;
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, isVideo, status, currentUserId]);

  // Handle incoming WebRTC signaling.
  useEffect(() => {
    if (!isVideo) return;

    const unsubscribe = onSignal(async (signal: RtcSignal) => {
      const data = signal.data as
        | { kind: "offer"; sdp: RTCSessionDescriptionInit }
        | { kind: "answer"; sdp: RTCSessionDescriptionInit }
        | { kind: "candidate"; candidate: RTCIceCandidateInit };
      const remoteId = signal.fromId;

      if (data.kind === "offer") {
        const pc = peersRef.current.get(remoteId) ?? createPeer(remoteId);
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal(remoteId, { kind: "answer", sdp: pc.localDescription });
      } else if (data.kind === "answer") {
        const pc = peersRef.current.get(remoteId);
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } else if (data.kind === "candidate") {
        const pc = peersRef.current.get(remoteId);
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch {
            /* ignore late candidates */
          }
        }
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideo, onSignal]);

  // Close all peers on unmount.
  useEffect(() => {
    const peers = peersRef.current;
    return () => {
      peers.forEach((pc) => pc.close());
      peers.clear();
    };
  }, []);

  function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft("");
  }

  const memberName = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach((m) => (map[m.userId] = m.name));
    return map;
  }, [members]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-4 border-black bg-zinc-950 p-5 shadow-[6px_6px_0px_#000000]">
          <div>
            <Link
              href="/bar-online"
              className="text-xs uppercase tracking-widest text-slate-400 hover:text-electric-yellow"
            >
              ← Salas
            </Link>
            <h1 className="mt-1 text-2xl font-bold uppercase tracking-widest text-white">
              {title}
            </h1>
          </div>
          <span
            className={`border-2 border-black px-3 py-1 text-xs font-bold uppercase tracking-widest text-black ${
              status === "connected" ? "bg-electric-yellow" : "bg-electric-red text-white"
            }`}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>

        {isVideo && (
          <div className="border-4 border-black bg-zinc-950 p-5 shadow-[6px_6px_0px_#000000]">
            {mediaError && (
              <div className="mb-4 border-4 border-black bg-electric-red p-3 text-sm font-bold text-white">
                {mediaError}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="relative border-4 border-electric-yellow bg-black">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="aspect-video w-full object-cover"
                />
                <span className="absolute bottom-1 left-1 bg-electric-yellow px-2 py-0.5 text-[10px] font-bold uppercase text-black">
                  Tú
                </span>
              </div>
              {Object.entries(remoteStreams).map(([id, stream]) => (
                <RemoteVideo key={id} stream={stream} name={memberName[id] ?? "Invitado"} />
              ))}
            </div>
          </div>
        )}

        <div className="flex h-[420px] flex-col border-4 border-black bg-zinc-950 shadow-[6px_6px_0px_#000000]">
          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <p className="text-sm uppercase tracking-widest text-slate-500">
                Sin mensajes todavía.
              </p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="font-mono text-sm">
                  <span
                    className={`font-bold ${
                      m.userId === currentUserId
                        ? "text-electric-yellow"
                        : "text-electric-blue"
                    }`}
                  >
                    {m.name}:
                  </span>{" "}
                  <span className="text-slate-200">{m.text}</span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <form
            onSubmit={handleSend}
            className="flex gap-3 border-t-4 border-black p-4"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 border-4 border-black bg-black px-4 py-2 font-mono text-white focus:border-electric-yellow focus:outline-none"
            />
            <button
              type="submit"
              className="border-4 border-black bg-electric-yellow px-5 py-2 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-white active:translate-x-1 active:translate-y-1"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>

      <aside className="border-4 border-black bg-zinc-950 p-5 shadow-[6px_6px_0px_#000000]">
        <h2 className="mb-4 border-b-4 border-black pb-2 text-sm font-bold uppercase tracking-widest text-electric-yellow">
          En la sala ({members.length})
        </h2>
        <ul className="space-y-2 font-mono text-sm">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-2 text-slate-200">
              <span className="inline-block h-2 w-2 bg-electric-yellow" />
              {m.name}
              {m.userId === currentUserId && (
                <span className="text-xs text-slate-500">(tú)</span>
              )}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function RemoteVideo({ stream, name }: { stream: MediaStream; name: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="relative border-4 border-electric-blue bg-black">
      <video ref={ref} autoPlay playsInline className="aspect-video w-full object-cover" />
      <span className="absolute bottom-1 left-1 bg-electric-blue px-2 py-0.5 text-[10px] font-bold uppercase text-black">
        {name}
      </span>
    </div>
  );
}
