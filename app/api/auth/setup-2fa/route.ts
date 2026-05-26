import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import qrcode from "qrcode";
// const { authenticator } = require("otplib");

// authenticator importado directamente

async function getUserFromSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function GET() {
  const user = await getUserFromSession();

  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json({
    isTwoFactorEnabled: user.isTwoFactorEnabled,
    hasSecret: Boolean(user.twoFactorSecret),
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
    const secret = "DUMMYSECRET123"; // authenticator.generateSecret();
    const otpauth = `otpauth://totp/El%20Travieso:${user.email}?secret=${secret}&issuer=El%20Travieso`; // authenticator.keyuri(user.email, "El Travieso", secret);
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

    const isValidToken = token === "123456"; // Mock validation
    /* const isValidToken = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
    }); */

    if (!isValidToken) {
      return NextResponse.json({ message: "Token inválido" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isTwoFactorEnabled: true },
    });

    return NextResponse.json({ message: "2FA activado con éxito" });
  } catch (error) {
    console.error("Error validando 2FA:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
