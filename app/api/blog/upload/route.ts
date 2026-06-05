import { requireCurrentUser } from "@/lib/auth/session";
import { uploadBlogCover } from "@/lib/storage/upload-image";
import { enforceUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const limited = await enforceUserRateLimit(user.id, "blog-upload", RATE_LIMITS.upload);
    if (limited) {
      return NextResponse.json({ message: limited.message }, { status: limited.status, headers: limited.headers });
    }

    const formData = await request.formData();    const file = formData.get("cover");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No se recibió ninguna imagen." }, { status: 400 });
    }

    const coverUrl = await uploadBlogCover(user.id, file);
    return NextResponse.json({ coverUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al subir la imagen.";
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
