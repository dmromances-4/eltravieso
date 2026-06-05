import { NextResponse } from "next/server";
import { revokeEmailOptIn } from "@/lib/marketing/consent";
import { verifyUnsubscribeToken } from "@/lib/marketing/unsubscribe";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ message: "Token inválido" }, { status: 400 });
  }

  const userId = verifyUnsubscribeToken(token);
  if (!userId) {
    return NextResponse.json({ message: "Token inválido o expirado" }, { status: 400 });
  }

  await revokeEmailOptIn(userId);

  return NextResponse.json({
    message: "Te has dado de baja de las comunicaciones por email.",
  });
}
