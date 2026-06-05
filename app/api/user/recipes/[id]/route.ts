import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getUserRoleFromDb } from "@/lib/security/authorization";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { videoUrl } = body as { videoUrl?: string };

    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    });

    if (!recipe) {
      return NextResponse.json({ message: "Receta no encontrada." }, { status: 404 });
    }

    if (recipe.authorId !== session.user.id) {
      const role = await getUserRoleFromDb(session.user.id);
      if (role !== "ADMIN") {
        return NextResponse.json(
          { message: "No puedes editar esta receta." },
          { status: 403 },
        );
      }
    }

    const trimmed = (videoUrl ?? "").trim();
    const updated = await prisma.recipe.update({
      where: { id: params.id },
      data: { videoUrl: trimmed.length > 0 ? trimmed : null },
      select: { id: true, videoUrl: true },
    });

    return NextResponse.json({ recipe: updated });
  } catch (error: any) {
    console.error("[RECIPE_VIDEO_PATCH_ERROR]:", error);
    return NextResponse.json(
      { message: error.message || "Error al actualizar el vídeo." },
      { status: 500 }
    );
  }
}
