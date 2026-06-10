import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { uploadMediaCover } from "@/lib/media/upload";
import { enforceUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const limited = await enforceUserRateLimit(user.id, "media-upload", RATE_LIMITS.upload);
    if (limited) {
      return NextResponse.json({ message: limited.message }, { status: limited.status, headers: limited.headers });
    }

    const formData = await request.formData();
    const file = formData.get("cover");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No se recibió ninguna imagen." }, { status: 400 });
    }

    const coverUrl = await uploadMediaCover(user.id, file);
    return NextResponse.json({ coverUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al subir.";
    return NextResponse.json({ message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
