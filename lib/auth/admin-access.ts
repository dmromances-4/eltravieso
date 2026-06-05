import type { Session } from "next-auth";
import prisma from "@/lib/prisma";
import { isAdmin2faRequired } from "@/lib/auth/admin-2fa-policy";

export type AdminAccessDeniedReason =
  | "unauthenticated"
  | "not_admin"
  | "2fa_not_enabled"
  | "2fa_not_verified";

export type AdminAccessResult =
  | { allowed: true; userId: string }
  | { allowed: false; reason: AdminAccessDeniedReason };

export async function evaluateAdminAccess(session: Session | null): Promise<AdminAccessResult> {
  if (!session?.user?.id) {
    return { allowed: false, reason: "unauthenticated" };
  }

  if (session.user.role !== "ADMIN") {
    return { allowed: false, reason: "not_admin" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isTwoFactorEnabled: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    return { allowed: false, reason: "not_admin" };
  }

  if (!isAdmin2faRequired()) {
    return { allowed: true, userId: dbUser.id };
  }

  if (!dbUser.isTwoFactorEnabled) {
    return { allowed: false, reason: "2fa_not_enabled" };
  }

  if (!session.user.twoFactorVerified) {
    return { allowed: false, reason: "2fa_not_verified" };
  }

  return { allowed: true, userId: dbUser.id };
}

export function adminAccessRedirect(reason: AdminAccessDeniedReason): string {
  switch (reason) {
    case "unauthenticated":
    case "2fa_not_verified":
      return "/login?callbackUrl=/admin&admin=1";
    case "not_admin":
      return "/cuenta?error=admin_denied";
    case "2fa_not_enabled":
      return "/setup-2fa?require=admin&callbackUrl=/admin";
    default:
      return "/login";
  }
}
