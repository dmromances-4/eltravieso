"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Client hook for a BarOnline room: presence, chat and WebRTC signaling.
// Connects to the standalone Socket.IO server (NEXT_PUBLIC_WS_URL).
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

export interface PresenceMember {
  userId: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  name: string;
  text: string;
  ts: number;
}

export interface RtcSignal {
  roomId: string;
  fromId: string;
  fromName: string;
  data: unknown;
}

export type ConnectionStatus = "connecting" | "connected" | "error" | "disconnected";

export interface RoomAccessError {
  roomId: string;
  message: string;
}

export interface UseBarOnlineResult {
  status: ConnectionStatus;
  members: PresenceMember[];
  messages: ChatMessage[];
  roomError: RoomAccessError | null;
  sendMessage: (text: string) => void;
  sendSignal: (targetId: string, data: unknown) => void;
  onSignal: (handler: (signal: RtcSignal) => void) => () => void;
}

export function useBarOnline(roomId: string | null): UseBarOnlineResult {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roomError, setRoomError] = useState<RoomAccessError | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const signalHandlers = useRef<Set<(signal: RtcSignal) => void>>(new Set());

  useEffect(() => {
    if (!roomId) return;

    const socket = io(WS_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("connected");
      socket.emit("room:join", { roomId });
    });

    socket.on("connect_error", () => setStatus("error"));
    socket.on("disconnect", () => setStatus("disconnected"));

    socket.on(
      "presence:update",
      (payload: { roomId: string; members: PresenceMember[] }) => {
        if (payload.roomId === roomId) setMembers(payload.members);
      }
    );

    socket.on("chat:message", (message: ChatMessage) => {
      if (message.roomId === roomId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on("rtc:signal", (signal: RtcSignal) => {
      if (signal.roomId !== roomId) return;
      signalHandlers.current.forEach((handler) => handler(signal));
    });

    socket.on("room:error", (payload: RoomAccessError) => {
      if (payload.roomId === roomId) {
        setRoomError(payload);
        setStatus("error");
      }
    });

    return () => {
      socket.emit("room:leave", { roomId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !roomId) return;
      socketRef.current?.emit("chat:message", { roomId, text: trimmed });
    },
    [roomId]
  );

  const sendSignal = useCallback(
    (targetId: string, data: unknown) => {
      if (!roomId) return;
      socketRef.current?.emit("rtc:signal", { roomId, targetId, data });
    },
    [roomId]
  );

  const onSignal = useCallback((handler: (signal: RtcSignal) => void) => {
    signalHandlers.current.add(handler);
    return () => {
      signalHandlers.current.delete(handler);
    };
  }, []);

  return { status, members, messages, roomError, sendMessage, sendSignal, onSignal };
}
