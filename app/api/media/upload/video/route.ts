import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { uploadEventVideo } from "@/lib/media/upload";
import { enforceUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
    if (session.user.role !== "ADMIN" && session.user.role !== "BAR_OWNER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const limited = await enforceUserRateLimit(session.user.id, "media-video", RATE_LIMITS.upload);
    if (limited) {
      return NextResponse.json({ message: limited.message }, { status: limited.status, headers: limited.headers });
    }

    const formData = await request.formData();
    const file = formData.get("video");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No se recibió ningún vídeo." }, { status: 400 });
    }

    const mediaUrl = await uploadEventVideo(session.user.id, file);
    return NextResponse.json({ mediaUrl, sourceType: "UPLOAD" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al subir.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
