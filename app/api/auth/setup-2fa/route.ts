import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import qrcode from "qrcode";
import {
  buildTwoFactorOtpAuthUri,
  createTwoFactorSecret,
  verifyTwoFactorToken,
} from "@/lib/auth/two-factor";

async function getUserFromSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function GET() {
  const user = await getUserFromSession();

  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json({
    isTwoFactorEnabled: user.isTwoFactorEnabled,
    hasSecret: Boolean(user.twoFactorSecret),
    role: user.role,
    adminRequires2fa: user.role === "ADMIN",
  });
}

export async function POST() {
  const user = await getUserFromSession();

  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (user.isTwoFactorEnabled) {
    return NextResponse.json({ message: "2FA ya está activado" }, { status: 400 });
  }

  try {
    const secret = createTwoFactorSecret();
    const otpauth = buildTwoFactorOtpAuthUri(user.email, secret);
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });

    return NextResponse.json({ qrCodeUrl, secret });
  } catch (error) {
    console.error("Error setup-2fa:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getUserFromSession();

  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const { token } = await req.json();

    if (!user.twoFactorSecret) {
      return NextResponse.json({ message: "Configuración 2FA no iniciada" }, { status: 400 });
    }

    const isValidToken = await verifyTwoFactorToken(user.twoFactorSecret, String(token ?? ""));
    if (!isValidToken) {
      return NextResponse.json({ message: "Código 2FA inválido" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isTwoFactorEnabled: true },
    });

    return NextResponse.json({
      message: "2FA activado con éxito",
      requiresReLogin: true,
      role: user.role,
    });
  } catch (error) {
    console.error("Error validando 2FA:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getUserFromSession();

  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (user.role === "ADMIN") {
    return NextResponse.json(
      {
        message:
          "Las cuentas de administración deben mantener 2FA activo para proteger ventas y datos de clientes.",
      },
      { status: 403 },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const password = String((body as { password?: string }).password ?? "");

    if (!password) {
      return NextResponse.json({ message: "Confirma tu contraseña para desactivar 2FA." }, { status: 400 });
    }

    const bcrypt = await import("bcryptjs");
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ message: "Contraseña incorrecta." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isTwoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return NextResponse.json({ message: "2FA desactivado correctamente." });
  } catch (error) {
    console.error("Error desactivando 2FA:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
