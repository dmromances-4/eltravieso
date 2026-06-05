// ─────────────────────────────────────────────────────────────────────────────
// BarOnline realtime server — standalone Socket.IO process.
//
// Next.js route handlers can't host long-lived WebSocket connections, so this
// runs as its own Node process (npm run dev:ws / start:ws). It backs presence
// and pub/sub on Redis (Upstash) via @socket.io/redis-adapter when REDIS_URL is
// set, falling back to a single-instance in-memory store for local dev.
//
// Responsibilities:
//   - Authenticate the handshake against the NextAuth JWT cookie.
//   - Track room presence (in Redis, never in PostgreSQL).
//   - Relay chat messages within a room.
//   - Relay WebRTC signaling (offer/answer/ICE) for VIDEO_CALL sessions.
// ─────────────────────────────────────────────────────────────────────────────

import { createServer } from "http";
import { randomUUID } from "crypto";
import { Server, type Socket } from "socket.io";
import { getToken } from "next-auth/jwt";
import { initRealtimeSentry, Sentry } from "../../lib/sentry/init-realtime.js";
import {
  createMemoryPresenceStore,
  createRedisPresenceStore,
  type PresenceStore,
} from "./presence.js";

initRealtimeSentry();
const PORT = Number(process.env.PORT ?? process.env.WS_PORT ?? 3001);
const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const REDIS_URL = process.env.REDIS_URL;

interface SocketUser {
  userId: string;
  name: string;
}

interface JoinPayload {
  roomId: string;
}

interface ChatPayload {
  roomId: string;
  text: string;
}

interface SignalPayload {
  roomId: string;
  targetId: string;
  data: unknown;
}

declare module "socket.io" {
  interface Socket {
    user?: SocketUser;
  }
}

function userRoom(userId: string) {
  return `user:${userId}`;
}

async function bootstrap() {
  if (!NEXTAUTH_SECRET) {
    console.warn(
      "[realtime] NEXTAUTH_SECRET is not set — handshake auth will reject every connection."
    );
  }

  const httpServer = createServer((req, res) => {
    const path = req.url?.split("?")[0] ?? "/";
    if (path === "/health" || path === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ service: "bar-online-realtime", ok: true }));
      return;
    }
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "Not found" }));
  });
  const io = new Server(httpServer, {
    cors: {
      origin: APP_ORIGIN,
      credentials: true,
    },
  });

  let presence: PresenceStore;

  if (REDIS_URL) {
    const { default: IORedis } = await import("ioredis");
    const { createAdapter } = await import("@socket.io/redis-adapter");

    const pubClient = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
    const subClient = pubClient.duplicate();
    const presenceClient = pubClient.duplicate();

    io.adapter(createAdapter(pubClient, subClient));
    presence = createRedisPresenceStore(presenceClient);
    console.log("[realtime] Redis adapter + presence store enabled.");
  } else {
    presence = createMemoryPresenceStore();
    console.warn(
      "[realtime] REDIS_URL not set — running single-instance with in-memory presence."
    );
  }

  // ── Handshake authentication via the NextAuth JWT cookie ──
  io.use(async (socket, next) => {
    try {
      const token = await getToken({
        req: socket.request as never,
        secret: NEXTAUTH_SECRET,
      });

      if (!token?.id) {
        return next(new Error("UNAUTHORIZED"));
      }

      socket.user = {
        userId: String(token.id),
        name: (token.name as string | undefined) ?? "Invitado",
      };
      socket.join(userRoom(socket.user.userId));
      next();
    } catch (error) {
      Sentry.captureException(error);
      console.error("[realtime] handshake auth failed:", error);
      next(new Error("UNAUTHORIZED"));
    }  });

  io.on("connection", (socket: Socket) => {
    const user = socket.user!;
    const joinedRooms = new Set<string>();

    async function broadcastPresence(roomId: string) {
      const members = await presence.list(roomId);
      io.to(roomId).emit("presence:update", { roomId, members });
    }

    socket.on("room:join", async ({ roomId }: JoinPayload) => {
      if (!roomId) return;
      try {
        const { assertBarOnlineRoomAccess } = await import("../../lib/realtime/room-access.js");
        await assertBarOnlineRoomAccess(user.userId, roomId);
      } catch {
        socket.emit("room:error", { roomId, message: "No tienes acceso a esta sala." });
        return;
      }
      socket.join(roomId);
      joinedRooms.add(roomId);
      await presence.add(roomId, socket.id, user);
      await broadcastPresence(roomId);
      socket.to(roomId).emit("room:user-joined", { roomId, user });
    });

    socket.on("room:leave", async ({ roomId }: JoinPayload) => {
      if (!roomId) return;
      socket.leave(roomId);
      joinedRooms.delete(roomId);
      await presence.remove(roomId, socket.id);
      await broadcastPresence(roomId);
      socket.to(roomId).emit("room:user-left", { roomId, user });
    });

    socket.on("chat:message", ({ roomId, text }: ChatPayload) => {
      const trimmed = (text ?? "").toString().slice(0, 2000).trim();
      if (!roomId || !trimmed) return;
      io.to(roomId).emit("chat:message", {
        id: randomUUID(),
        roomId,
        userId: user.userId,
        name: user.name,
        text: trimmed,
        ts: Date.now(),
      });
    });

    // WebRTC signaling passthrough — media stays peer-to-peer.
    socket.on("rtc:signal", ({ roomId, targetId, data }: SignalPayload) => {
      if (!roomId || !targetId) return;
      io.to(userRoom(targetId)).emit("rtc:signal", {
        roomId,
        fromId: user.userId,
        fromName: user.name,
        data,
      });
    });

    socket.on("disconnect", async () => {
      for (const roomId of joinedRooms) {
        await presence.remove(roomId, socket.id);
        await broadcastPresence(roomId);
        socket.to(roomId).emit("room:user-left", { roomId, user });
      }
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`[realtime] BarOnline socket server listening on :${PORT}`);
    console.log(`[realtime] Accepting connections from ${APP_ORIGIN}`);
  });
}

bootstrap().catch((error) => {
  Sentry.captureException(error);
  console.error("[realtime] fatal bootstrap error:", error);
  Sentry.flush(2000).finally(() => process.exit(1));
});