import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { serializeUserProfile } from "@/lib/user/profile";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json(serializeUserProfile(user));
}
