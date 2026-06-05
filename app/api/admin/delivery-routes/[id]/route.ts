import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";

type RouteContext = { params: { id: string } };

const VALID_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await requireAdminUser();

    const existing = await prisma.deliveryRoute.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ message: "Ruta no encontrada." }, { status: 404 });
    }

    const body = await request.json();
    const data: {
      status?: typeof VALID_STATUSES[number];
      vehiclePlate?: string | null;
      notes?: string | null;
      startedAt?: Date | null;
      completedAt?: Date | null;
    } = {};

    if (body.status != null) {
      const status = String(body.status).toUpperCase();
      if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
        return NextResponse.json({ message: "Estado inválido." }, { status: 400 });
      }
      data.status = status as typeof VALID_STATUSES[number];
      if (status === "IN_PROGRESS" && !existing.startedAt) data.startedAt = new Date();
      if (status === "COMPLETED") data.completedAt = new Date();
    }

    if (body.vehiclePlate !== undefined) {
      data.vehiclePlate = body.vehiclePlate ? String(body.vehiclePlate).trim() : null;
    }
    if (body.notes !== undefined) {
      data.notes = body.notes ? String(body.notes).trim() : null;
    }

    const route = await prisma.deliveryRoute.update({
      where: { id: params.id },
      data,
      include: {
        stops: {
          include: { barProfile: { select: { businessName: true, city: true } } },
          orderBy: { stopOrder: "asc" },
        },
        orders: { select: { id: true, orderNumber: true, status: true } },
      },
    });

    return NextResponse.json({ route, message: "Ruta actualizada." });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await requireAdminUser();

    const existing = await prisma.deliveryRoute.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ message: "Ruta no encontrada." }, { status: 404 });
    }

    if (existing.status === "IN_PROGRESS") {
      return NextResponse.json(
        { message: "No se puede eliminar una ruta en curso." },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.wholesaleOrder.updateMany({
        where: { deliveryRouteId: params.id },
        data: { deliveryRouteId: null },
      }),
      prisma.deliveryRoute.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json({ message: "Ruta eliminada." });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
