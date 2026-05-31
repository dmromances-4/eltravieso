import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { normalizeEmail, validateEmail, validateName, validatePassword } from "@/lib/validations/user";

export async function POST(req: Request) {
  try {
    const { email, password, name, confirmPassword } = await req.json();

    const emailError = validateEmail(String(email ?? ""));
    if (emailError) {
      return NextResponse.json({ message: emailError }, { status: 400 });
    }

    const nameError = validateName(String(name ?? ""));
    if (nameError) {
      return NextResponse.json({ message: nameError }, { status: 400 });
    }

    const passwordError = validatePassword(String(password ?? ""));
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 });
    }

    if (confirmPassword != null && String(password) !== String(confirmPassword)) {
      return NextResponse.json({ message: "Las contraseñas no coinciden." }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Ya existe una cuenta con este email." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: String(name).trim(),
        role: "USER",
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json(
      { message: "Cuenta creada correctamente.", user },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
  }
}
