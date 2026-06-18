import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isSupportedLocale } from "@/lib/i18n/request-locale";
import { jsonError } from "@/lib/i18n/api";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonError(request, "unauthorized", 401);
  }

  const body = (await request.json()) as { locale?: string };
  if (!body.locale || !isSupportedLocale(body.locale)) {
    return jsonError(request, "validation", 400);
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { preferredLocale: body.locale },
  });

  return NextResponse.json({ locale: body.locale });
}
