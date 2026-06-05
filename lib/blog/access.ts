import { isAdminUser } from "@/lib/auth/admin-api";

export async function canManageBlogPost(
  userId: string,
  authorId: string | null,
): Promise<boolean> {
  if (authorId && userId === authorId) return true;
  return isAdminUser(userId);
}
