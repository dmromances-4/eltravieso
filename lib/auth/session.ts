import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { userProfileSelect } from "@/lib/user/profile";

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getAuthSession();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: userProfileSelect,
  });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
