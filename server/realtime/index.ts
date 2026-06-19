import { createServer } from "http";
import { randomUUID } from "crypto";
import { Server, type Socket } from "socket.io";
import { getToken } from "next-auth/jwt";
import { initRealtimeSentry, Sentry } from "../../lib/sentry/init-realtime.js";
import { logRealtimeEvent, withSocketHandler } from "../../lib/observability/realtime-log.js";
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

function captureSocketError(error: unknown, context: { eventName: string; userId?: string; roomId?: string }) {
  Sentry.withScope((scope) => {
    scope.setTag("scope", "bar-online-realtime");
    scope.setTag("socketEvent", context.eventName);
    if (context.userId) scope.setTag("userId", context.userId);
    if (context.roomId) scope.setTag("roomId", context.roomId);
    Sentry.captureException(error);
  });
  logRealtimeEvent("error", "socket.handler.failed", {
    eventName: context.eventName,
    userId: context.userId,
    roomId: context.roomId,
    error: error instanceof Error ? error.message : String(error),
  });
}

async function bootstrap() {
  if (!NEXTAUTH_SECRET) {
    console.warn(
      "[realtime] NEXTAUTH_SECRET is not set — handshake auth will reject every connection.",
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
      "[realtime] REDIS_URL not set — running single-instance with in-memory presence.",
    );
  }

  io.use(async (socket, next) => {
    const request = socket.request as {
      headers: Record<string, string | string[] | undefined>;
      _query?: Record<string, string>;
    };
    const query = request._query ?? {};
    const sentryTrace =
      (typeof request.headers["sentry-trace"] === "string" ? request.headers["sentry-trace"] : undefined) ??
      query["sentry-trace"];
    const baggage =
      (typeof request.headers.baggage === "string" ? request.headers.baggage : undefined) ?? query.baggage;

    const authenticate = async () =>
      Sentry.startSpan({ name: "bar_online.handshake", op: "auth" }, async () => {
        try {
          const token = await getToken({
            req: socket.request as never,
            secret: NEXTAUTH_SECRET,
          });

          if (!token?.id) {
            logRealtimeEvent("warn", "bar_online.auth.failure", {
              reason: "missing_token",
              requestId: query["x-request-id"],
            });
            return next(new Error("UNAUTHORIZED"));
          }

          socket.user = {
            userId: String(token.id),
            name: (token.name as string | undefined) ?? "Invitado",
          };
          socket.join(userRoom(socket.user.userId));
          return next();
        } catch (error) {
          captureSocketError(error, { eventName: "handshake" });
          return next(new Error("UNAUTHORIZED"));
        }
      });

    if (sentryTrace || baggage) {
      return Sentry.continueTrace({ sentryTrace, baggage }, authenticate);
    }

    return authenticate();
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.user!;
    const joinedRooms = new Set<string>();

    async function broadcastPresence(roomId: string) {
      const members = await presence.list(roomId);
      io.to(roomId).emit("presence:update", { roomId, members });
    }

    socket.on(
      "room:join",
      withSocketHandler("room:join", async ({ roomId }: JoinPayload) => {
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
        logRealtimeEvent("info", "bar_online.room.join", {
          userId: user.userId,
          roomId,
        });
      }, (error, ctx) => captureSocketError(error, { ...ctx, userId: user.userId })),
    );

    socket.on(
      "room:leave",
      withSocketHandler("room:leave", async ({ roomId }: JoinPayload) => {
        if (!roomId) return;
        socket.leave(roomId);
        joinedRooms.delete(roomId);
        await presence.remove(roomId, socket.id);
        await broadcastPresence(roomId);
        socket.to(roomId).emit("room:user-left", { roomId, user });
      }, (error, ctx) => captureSocketError(error, { ...ctx, userId: user.userId })),
    );

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

    socket.on("rtc:signal", ({ roomId, targetId, data }: SignalPayload) => {
      if (!roomId || !targetId) return;
      io.to(userRoom(targetId)).emit("rtc:signal", {
        roomId,
        fromId: user.userId,
        fromName: user.name,
        data,
      });
    });

    socket.on(
      "disconnect",
      withSocketHandler("disconnect", async () => {
        for (const roomId of joinedRooms) {
          await presence.remove(roomId, socket.id);
          await broadcastPresence(roomId);
          socket.to(roomId).emit("room:user-left", { roomId, user });
        }
      }, (error, ctx) => captureSocketError(error, { ...ctx, userId: user.userId })),
    );
  });

  httpServer.listen(PORT, () => {
    console.log(`[realtime] BarOnline socket server listening on :${PORT}`);
    console.log(`[realtime] Accepting connections from ${APP_ORIGIN}`);
  });
}

bootstrap().catch((error) => {
  Sentry.captureException(error);
  logRealtimeEvent("error", "bar_online.bootstrap.failed", {
    error: error instanceof Error ? error.message : String(error),
  });
  Sentry.flush(2000).finally(() => process.exit(1));
});
