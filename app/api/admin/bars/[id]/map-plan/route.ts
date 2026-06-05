import { NextResponse } from "next/server";
import { AdminApiError, adminApiErrorResponse, requireAdminUser } from "@/lib/auth/admin-api";
import { applyMapPlanFields } from "@/lib/billing/map-plan";
import prisma from "@/lib/prisma";
import type { MapPlanTier } from "@prisma/client";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminUser();
  } catch (error) {
    return adminApiErrorResponse(error);
  }

  try {
    const body = await request.json();
    const mapPlan = body.mapPlan as MapPlanTier;
    if (!["FREE", "FEATURED", "BOOKING_PLUS"].includes(mapPlan)) {
      return NextResponse.json({ error: "Plan no válido" }, { status: 400 });
    }

    const expiresAt = body.mapPlanExpiresAt ? new Date(body.mapPlanExpiresAt) : null;
    const updated = await prisma.barProfile.update({
      where: { id: params.id },
      data: applyMapPlanFields(mapPlan, expiresAt),
    });

    return NextResponse.json({ profile: updated });
  } catch (error) {
    if (error instanceof AdminApiError) return adminApiErrorResponse(error);
    return NextResponse.json({ error: "No se pudo actualizar el plan" }, { status: 500 });
  }
}
