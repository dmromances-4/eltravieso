import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { validatePassword } from "@/lib/validations/user";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");

    if (!currentPassword) {
      return NextResponse.json({ message: "Indica tu contraseña actual." }, { status: 400 });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: "Las contraseñas nuevas no coinciden." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado." }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ message: "La contraseña actual no es correcta." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Contraseña actualizada correctamente." });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json({ message: "Error al cambiar la contraseña." }, { status: 500 });
  }
}
