import prisma from "@/lib/prisma";

export async function canJoinBarOnlineRoom(userId: string, roomId: string): Promise<boolean> {
  const session = await prisma.barOnlineSession.findFirst({
    where: { roomId, isActive: true },
    select: {
      hostId: true,
      participants: { where: { id: userId }, select: { id: true } },
    },
  });

  if (!session) return false;
  if (session.hostId === userId) return true;
  if (session.participants.length > 0) return true;

  // Sala activa listada en el lobby: cualquier usuario autenticado puede unirse.
  return true;
}

export async function assertBarOnlineRoomAccess(userId: string, roomId: string): Promise<void> {
  const allowed = await canJoinBarOnlineRoom(userId, roomId);
  if (!allowed) {
    throw new Error("ROOM_FORBIDDEN");
  }
}
