import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";
import { generateRouteCode } from "@/lib/delivery/route-code";

type StopInput = { barProfileId: string; stopOrder?: number };

export async function GET() {
  try {
    await requireAdminUser();

    const routes = await prisma.deliveryRoute.findMany({
      orderBy: { plannedDate: "desc" },
      include: {
        stops: {
          include: { barProfile: { select: { businessName: true, city: true } } },
          orderBy: { stopOrder: "asc" },
        },
        orders: { select: { id: true, orderNumber: true, status: true } },
      },
      take: 50,
    });

    return NextResponse.json({ routes });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUser();
    const body = await request.json();

    const plannedDate = body.plannedDate ? new Date(String(body.plannedDate)) : new Date();
    if (Number.isNaN(plannedDate.getTime())) {
      return NextResponse.json({ message: "Fecha planificada inválida." }, { status: 400 });
    }

    const stops = (body.stops ?? []) as StopInput[];
    const orderIds = Array.isArray(body.orderIds) ? body.orderIds.map(String) : [];

    if (stops.length === 0 && orderIds.length === 0) {
      return NextResponse.json(
        { message: "Añade al menos una parada o un pedido mayorista." },
        { status: 400 },
      );
    }

    let routeCode = body.routeCode ? String(body.routeCode).trim() : "";
    if (!routeCode) {
      const firstBar = stops[0]
        ? await prisma.barProfile.findUnique({
            where: { id: stops[0].barProfileId },
            select: { city: true },
          })
        : orderIds[0]
          ? await prisma.wholesaleOrder.findUnique({
              where: { id: orderIds[0] },
              include: { barProfile: { select: { city: true } } },
            })
          : null;
      const city =
        firstBar && "barProfile" in firstBar
          ? firstBar.barProfile?.city
          : firstBar && "city" in firstBar
            ? firstBar.city
            : undefined;
      routeCode = await generateRouteCode(city ?? undefined);
    }

    const route = await prisma.$transaction(async (tx) => {
      const created = await tx.deliveryRoute.create({
        data: {
          routeCode,
          plannedDate,
          vehiclePlate: body.vehiclePlate ? String(body.vehiclePlate).trim() : null,
          notes: body.notes ? String(body.notes).trim() : null,
          status: "PLANNED",
        },
      });

      const stopBarIds = new Set<string>();

      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        await tx.deliveryStop.create({
          data: {
            deliveryRouteId: created.id,
            barProfileId: stop.barProfileId,
            stopOrder: stop.stopOrder ?? i + 1,
          },
        });
        stopBarIds.add(stop.barProfileId);
      }

      if (orderIds.length > 0) {
        const orders = await tx.wholesaleOrder.findMany({
          where: { id: { in: orderIds } },
          include: { barProfile: { select: { id: true } } },
        });

        for (const order of orders) {
          await tx.wholesaleOrder.update({
            where: { id: order.id },
            data: { deliveryRouteId: created.id },
          });

          if (!stopBarIds.has(order.barProfile.id)) {
            const nextOrder = stopBarIds.size + 1;
            await tx.deliveryStop.create({
              data: {
                deliveryRouteId: created.id,
                barProfileId: order.barProfile.id,
                stopOrder: nextOrder,
              },
            });
            stopBarIds.add(order.barProfile.id);
          }
        }
      }

      return tx.deliveryRoute.findUnique({
        where: { id: created.id },
        include: {
          stops: {
            include: { barProfile: { select: { businessName: true, city: true } } },
            orderBy: { stopOrder: "asc" },
          },
          orders: { select: { id: true, orderNumber: true, status: true } },
        },
      });
    });

    return NextResponse.json({ route, message: "Ruta creada." });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
