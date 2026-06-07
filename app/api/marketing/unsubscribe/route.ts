import { NextResponse } from "next/server";
import { revokeEmailOptIn } from "@/lib/marketing/consent";
import { verifyUnsubscribeToken } from "@/lib/marketing/unsubscribe";

function appOrigin(request: Request) {
  return (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const origin = appOrigin(request);

  if (!token) {
    return NextResponse.redirect(`${origin}/marketing/unsubscribe?error=invalid`);
  }

  const userId = verifyUnsubscribeToken(token);
  if (!userId) {
    return NextResponse.redirect(`${origin}/marketing/unsubscribe?error=invalid`);
  }

  await revokeEmailOptIn(userId);

  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("application/json")) {
    return NextResponse.json({
      message: "Te has dado de baja de las comunicaciones por email.",
    });
  }

  return NextResponse.redirect(`${origin}/marketing/unsubscribe?ok=1`);
}
