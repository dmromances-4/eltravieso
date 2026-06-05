import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { evaluateAdminAccess, type AdminAccessDeniedReason } from "@/lib/auth/admin-access";

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403 = 403,
    readonly reason?: AdminAccessDeniedReason,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

const REASON_MESSAGES: Record<AdminAccessDeniedReason, { message: string; status: 401 | 403 }> = {
  unauthenticated: { message: "No autorizado", status: 401 },
  not_admin: { message: "Acceso denegado", status: 403 },
  "2fa_not_enabled": { message: "2FA obligatorio para administradores", status: 403 },
  "2fa_not_verified": { message: "Verificación 2FA requerida", status: 403 },
};

export async function requireAdminUser() {
  const session = await getServerSession(authOptions);
  const access = await evaluateAdminAccess(session);

  if (!access.allowed) {
    const mapped = REASON_MESSAGES[access.reason];
    throw new AdminApiError(mapped.message, mapped.status, access.reason);
  }

  const user = await prisma.user.findUnique({
    where: { id: access.userId },
    select: { id: true, role: true, email: true, name: true },
  });

  if (!user || user.role !== "ADMIN") {
    throw new AdminApiError("Acceso denegado", 403, "not_admin");
  }

  return user;
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isTwoFactorEnabled: true },
  });
  return user?.role === "ADMIN" && Boolean(user.isTwoFactorEnabled);
}

export function adminApiErrorResponse(error: unknown) {
  if (error instanceof AdminApiError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Error interno";
  const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
  return NextResponse.json({ message }, { status });
}
