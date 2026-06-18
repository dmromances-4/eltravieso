import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { normalizeEmail, validateEmail, validateName, validatePassword } from "@/lib/validations/user";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getRequestLocaleFromHeaders } from "@/lib/i18n/request-locale";
import { getApiMessage } from "@/lib/i18n/errors";

export async function POST(req: Request) {
  const locale = getRequestLocaleFromHeaders(req);
  const limited = await enforceRateLimit(req, "register", RATE_LIMITS.register);
  if (limited) {
    return NextResponse.json({ message: limited.message }, { status: limited.status, headers: limited.headers });
  }

  try {
    const { email, password, name, confirmPassword, marketingEmailOptIn, marketingSmsOptIn } = await req.json();

    const emailError = validateEmail(String(email ?? ""), locale);
    if (emailError) {
      return NextResponse.json({ message: emailError }, { status: 400 });
    }

    const nameError = validateName(String(name ?? ""), locale);
    if (nameError) {
      return NextResponse.json({ message: nameError }, { status: 400 });
    }

    const passwordError = validatePassword(String(password ?? ""), 8, locale);
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 });
    }

    if (confirmPassword != null && String(password) !== String(confirmPassword)) {
      return NextResponse.json(
        {
          message:
            locale === "en" ? "Passwords do not match." : "Las contraseñas no coinciden.",
        },
        { status: 400 },
      );
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: await getApiMessage(locale, "emailTaken") },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: String(name).trim(),
        role: "USER",
        marketingConsent: {
          create: {
            emailOptIn: Boolean(marketingEmailOptIn),
            smsOptIn: Boolean(marketingSmsOptIn),
            whatsappOptIn: Boolean(marketingSmsOptIn),
            consentSource: "register",
            consentedAt: new Date(),
          },
        },
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
