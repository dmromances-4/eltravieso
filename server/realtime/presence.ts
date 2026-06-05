// ─────────────────────────────────────────────────────────────────────────────
// Presence store for BarOnline rooms.
// Backed by Redis (Upstash / ioredis) when REDIS_URL is set, with an in-memory
// fallback so local development works without a Redis instance.
// Presence is intentionally NEVER persisted to PostgreSQL.
// ─────────────────────────────────────────────────────────────────────────────

import type Redis from "ioredis";

export interface PresenceMember {
  userId: string;
  name: string;
}

export interface PresenceStore {
  add(roomId: string, socketId: string, member: PresenceMember): Promise<void>;
  remove(roomId: string, socketId: string): Promise<void>;
  list(roomId: string): Promise<PresenceMember[]>;
}

function presenceKey(roomId: string) {
  return `presence:${roomId}`;
}

/** Deduplicate members by userId (a single user may open several tabs). */
function dedupe(members: PresenceMember[]): PresenceMember[] {
  const seen = new Map<string, PresenceMember>();
  for (const member of members) {
    if (!seen.has(member.userId)) seen.set(member.userId, member);
  }
  return [...seen.values()];
}

export function createRedisPresenceStore(client: Redis): PresenceStore {
  return {
    async add(roomId, socketId, member) {
      await client.hset(presenceKey(roomId), socketId, JSON.stringify(member));
    },
    async remove(roomId, socketId) {
      await client.hdel(presenceKey(roomId), socketId);
    },
    async list(roomId) {
      const raw = await client.hgetall(presenceKey(roomId));
      const members = Object.values(raw)
        .map((value) => {
          try {
            return JSON.parse(value) as PresenceMember;
          } catch {
            return null;
          }
        })
        .filter((value): value is PresenceMember => value !== null);
      return dedupe(members);
    },
  };
}

export function createMemoryPresenceStore(): PresenceStore {
  const rooms = new Map<string, Map<string, PresenceMember>>();

  return {
    async add(roomId, socketId, member) {
      const room = rooms.get(roomId) ?? new Map<string, PresenceMember>();
      room.set(socketId, member);
      rooms.set(roomId, room);
    },
    async remove(roomId, socketId) {
      const room = rooms.get(roomId);
      if (!room) return;
      room.delete(socketId);
      if (room.size === 0) rooms.delete(roomId);
    },
    async list(roomId) {
      const room = rooms.get(roomId);
      if (!room) return [];
      return dedupe([...room.values()]);
    },
  };
}
