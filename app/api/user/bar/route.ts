import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { ReservationProvider } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { geocodeAddress } from "@/lib/geocoding/nominatim";
import { generateUniqueBarSlug } from "@/lib/venues/unique-slug";
import { sanitizeBarProfileForClient } from "@/lib/security/bar-profile";
import { parseSecretUpdate } from "@/lib/security/redact";

const RESERVATION_PROVIDERS = new Set<string>([
  "COVER_MANAGER",
  "THE_FORK",
  "SEVEN_ROOMS",
  "OPEN_TABLE",
  "EXTERNAL",
]);

function parseVibeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const profile = await prisma.barProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        guideEntry: {
          select: { worlds50bestRank: true, worlds50bestCategory: true },
        },
      },
    });

    return NextResponse.json({
      profile: profile ? sanitizeBarProfileForClient(profile) : null,
    });
  } catch (error: unknown) {
    console.error("[BAR_PROFILE_GET_ERROR]:", error);
    const message = error instanceof Error ? error.message : "Error al obtener el perfil de bar.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      businessName,
      taxId,
      licenseNumber,
      googleBusinessId,
      coverManagerUrl,
      theForkUrl,
      tpvProvider,
      tpvToken,
      address,
      city,
      postalCode,
      province,
      country,
      phone,
      email,
      autoReorderEnabled,
      autoReorderThreshold,
      venueType,
      photoUrl,
      isPublicOnMap,
      history,
      foundationYear,
      signatureDrink,
      dressCode,
      verdict,
      vibeTags,
      reservationProvider,
      reservationUrl,
    } = body;

    if (!businessName || !taxId || !address || !city || !postalCode) {
      return NextResponse.json(
        { message: "Faltan campos obligatorios para registrar el local." },
        { status: 400 },
      );
    }

    const existing = await prisma.barProfile.findUnique({
      where: { userId: session.user.id },
    });

    const addressChanged =
      !existing ||
      existing.address !== address ||
      existing.city !== city ||
      existing.postalCode !== postalCode;

    let latitude = existing?.latitude ?? null;
    let longitude = existing?.longitude ?? null;

    if (addressChanged || latitude == null || longitude == null) {
      const coords = await geocodeAddress({
        address,
        city,
        postalCode,
        province: province || undefined,
        country: country || "España",
      });
      if (coords) {
        latitude = coords.latitude;
        longitude = coords.longitude;
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    let slug = existing?.slug ?? null;
    if (!slug || existing?.businessName !== businessName) {
      slug = await generateUniqueBarSlug(businessName, existing?.id);
    }

    const parsedProvider =
      typeof reservationProvider === "string" && RESERVATION_PROVIDERS.has(reservationProvider)
        ? (reservationProvider as ReservationProvider)
        : null;

    const loreFields = {
      slug,
      history: history?.trim() || null,
      foundationYear: foundationYear ? Number(foundationYear) : null,
      signatureDrink: signatureDrink?.trim() || null,
      dressCode: dressCode?.trim() || null,
      verdict: verdict?.trim() || null,
      vibeTags: parseVibeTags(vibeTags),
      reservationProvider: parsedProvider,
      reservationUrl: reservationUrl?.trim() || null,
    };

    const tpvTokenUpdate = parseSecretUpdate(tpvToken);

    const profile = await prisma.barProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        businessName,
        taxId,
        licenseNumber: licenseNumber || null,
        googleBusinessId: googleBusinessId || null,
        coverManagerUrl: coverManagerUrl || null,
        theForkUrl: theForkUrl || null,
        tpvProvider: tpvProvider || null,
        ...(tpvTokenUpdate !== undefined ? { tpvToken: tpvTokenUpdate } : {}),
        tpvWebhookUrl: `${appUrl}/api/tpv/webhook`,
        venueType: venueType || null,
        photoUrl: photoUrl || null,
        isPublicOnMap: Boolean(isPublicOnMap),
        latitude,
        longitude,
        address,
        city,
        postalCode,
        province: province || null,
        country: country || "España",
        phone: phone || null,
        email: email || null,
        autoReorderEnabled: Boolean(autoReorderEnabled),
        autoReorderThreshold: autoReorderThreshold ? Number(autoReorderThreshold) : null,
        ...loreFields,
      },
      update: {
        businessName,
        taxId,
        licenseNumber: licenseNumber || null,
        googleBusinessId: googleBusinessId || null,
        coverManagerUrl: coverManagerUrl || null,
        theForkUrl: theForkUrl || null,
        tpvProvider: tpvProvider || null,
        ...(tpvTokenUpdate !== undefined ? { tpvToken: tpvTokenUpdate } : {}),
        venueType: venueType || null,
        photoUrl: photoUrl || null,
        isPublicOnMap: Boolean(isPublicOnMap),
        latitude,
        longitude,
        address,
        city,
        postalCode,
        province: province || null,
        country: country || "España",
        phone: phone || null,
        email: email || null,
        autoReorderEnabled: Boolean(autoReorderEnabled),
        autoReorderThreshold: autoReorderThreshold ? Number(autoReorderThreshold) : null,
        ...loreFields,
      },
      include: {
        guideEntry: {
          select: { worlds50bestRank: true, worlds50bestCategory: true },
        },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (user && user.role === "USER") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: "BAR_OWNER" },
      });
    }

    return NextResponse.json({
      message: "Perfil del local actualizado correctamente.",
      profile: sanitizeBarProfileForClient(profile),
    });
  } catch (error: unknown) {
    console.error("[BAR_PROFILE_PATCH_ERROR]:", error);
    const message = error instanceof Error ? error.message : "Error al actualizar el perfil de bar.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
