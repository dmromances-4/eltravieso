import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { uploadUserAvatar } from "@/lib/storage/upload-avatar";
import { serializeUserProfile } from "@/lib/user/profile";
import { enforceUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const limited = await enforceUserRateLimit(session.user.id, "avatar-upload", RATE_LIMITS.upload);
  if (limited) {
    return NextResponse.json({ message: limited.message }, { status: limited.status, headers: limited.headers });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: "Selecciona una imagen para subir." }, { status: 400 });
    }

    const imageUrl = await uploadUserAvatar(session.user.id, file);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { imageUrl },
      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true,
        birthDate: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        role: true,
        isTwoFactorEnabled: true,
        twoFactorSecret: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Fotografía actualizada.",
      imageUrl,
      user: serializeUserProfile(user),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al subir la imagen.";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { imageUrl: null },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
      birthDate: true,
      address: true,
      city: true,
      postalCode: true,
      country: true,
      role: true,
      isTwoFactorEnabled: true,
      twoFactorSecret: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    message: "Fotografía eliminada.",
    user: serializeUserProfile(user),
  });
}
