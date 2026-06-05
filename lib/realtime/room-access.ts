import prisma from "@/lib/prisma";
import { isActiveVip } from "@/lib/membership/entitlements";
import { freeMaxRoomUsers, vipMaxRoomUsers } from "@/lib/membership/entitlements";

export async function canJoinBarOnlineRoom(userId: string, roomId: string): Promise<boolean> {
  const session = await prisma.barOnlineSession.findFirst({
    where: { roomId, isActive: true },
    select: {
      hostId: true,
      isPrivate: true,
      maxUsers: true,
      participants: { select: { id: true } },
    },
  });

  if (!session) return false;
  if (session.hostId === userId) return true;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { membershipStatus: true, membershipExpiresAt: true },
  });
  const userIsVip = user ? isActiveVip(user) : false;

  if (session.isPrivate && !userIsVip) {
    const host = await prisma.user.findUnique({
      where: { id: session.hostId },
      select: { membershipStatus: true, membershipExpiresAt: true },
    });
    if (!host || !isActiveVip(host)) return false;
  }

  if (session.participants.some((p) => p.id === userId)) return true;

  if (session.participants.length >= session.maxUsers) return false;

  if (session.isPrivate) return userIsVip;

  return true;
}

export async function assertBarOnlineRoomAccess(userId: string, roomId: string): Promise<void> {
  const allowed = await canJoinBarOnlineRoom(userId, roomId);
  if (!allowed) {
    throw new Error("ROOM_FORBIDDEN");
  }
}

export function resolveMaxUsersForHost(isVip: boolean, requested?: number): number {
  const cap = isVip ? vipMaxRoomUsers() : freeMaxRoomUsers();
  if (!requested || !Number.isFinite(requested)) return cap;
  return Math.min(Math.max(2, Math.floor(requested)), cap);
}
