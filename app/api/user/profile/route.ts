import { NextResponse } from "next/server";
import { logServerError } from '@/lib/security/safe-error';
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { parseBirthDateInput, serializeUserProfile, userProfileSelect } from "@/lib/user/profile";
import {
  normalizeEmail,
  validateAddressLine,
  validateBirthDate,
  validateEmail,
  validateName,
  validatePostalCode,
} from "@/lib/validations/user";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: userProfileSelect,
    });

    if (!current) {
      return NextResponse.json({ message: "Usuario no encontrado." }, { status: 404 });
    }

    const name = String(body.name ?? "").trim();
    const email = normalizeEmail(String(body.email ?? current.email));
    const currentPassword = String(body.currentPassword ?? "");
    const address = String(body.address ?? "").trim();
    const city = String(body.city ?? "").trim();
    const postalCode = String(body.postalCode ?? "").trim();
    const country = String(body.country ?? "España").trim() || "España";
    const birthDateRaw = body.birthDate == null || body.birthDate === "" ? null : String(body.birthDate);

    const nameError = validateName(name);
    if (nameError) return NextResponse.json({ message: nameError }, { status: 400 });

    const emailError = validateEmail(email);
    if (emailError) return NextResponse.json({ message: emailError }, { status: 400 });

    const birthError = validateBirthDate(birthDateRaw);
    if (birthError) return NextResponse.json({ message: birthError }, { status: 400 });

    const addressError = validateAddressLine(address, "La dirección", false);
    if (addressError) return NextResponse.json({ message: addressError }, { status: 400 });

    const cityError = validateAddressLine(city, "La ciudad", false);
    if (cityError) return NextResponse.json({ message: cityError }, { status: 400 });

    const postalError = validatePostalCode(postalCode);
    if (postalError) return NextResponse.json({ message: postalError }, { status: 400 });

    const emailChanged = email !== current.email;
    if (emailChanged) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: "Introduce tu contraseña actual para cambiar el email." },
          { status: 400 },
        );
      }

      const passwordOk = await bcrypt.compare(currentPassword, current.password);
      if (!passwordOk) {
        return NextResponse.json({ message: "Contraseña actual incorrecta." }, { status: 400 });
      }

      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken && taken.id !== current.id) {
        return NextResponse.json({ message: "Ese email ya está en uso." }, { status: 400 });
      }
    }

    let birthDate: Date | null = null;
    try {
      birthDate = parseBirthDateInput(birthDateRaw);
    } catch (err: unknown) {
      return NextResponse.json(
        { message: err instanceof Error ? err.message : "Fecha inválida." },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
        birthDate,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        country,
      },
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
      message: "Perfil actualizado correctamente.",
      user: serializeUserProfile(user),
    });
  } catch (error) {
    logServerError('user-profile', error);
    return NextResponse.json({ message: "Error al actualizar el perfil." }, { status: 500 });
  }
}
