import prisma from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export class AuthorizationError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403 = 403,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function getUserRoleFromDb(userId: string): Promise<UserRole | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role ?? null;
}

export async function assertWholesaleDispatchAccess(
  userId: string,
  barProfileUserId: string,
): Promise<UserRole> {
  const role = await getUserRoleFromDb(userId);
  if (!role) {
    throw new AuthorizationError("No autorizado", 401);
  }

  if (role === "USER") {
    throw new AuthorizationError("No tienes permisos para despachar pedidos mayoristas.", 403);
  }

  if (role === "BAR_OWNER" && barProfileUserId !== userId) {
    throw new AuthorizationError("No tienes permisos para despachar este bar.", 403);
  }

  return role;
}
