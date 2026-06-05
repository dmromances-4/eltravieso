import prisma from "@/lib/prisma";
import DeliveryRouteForm from "@/components/admin/DeliveryRouteForm";
import DeliveryRoutesList from "@/components/admin/DeliveryRoutesList";

export const dynamic = "force-dynamic";

export default async function AdminDeliveryPage() {
  const [routes, bars, unassignedOrders] = await Promise.all([
    prisma.deliveryRoute.findMany({
      orderBy: { plannedDate: "desc" },
      include: {
        stops: {
          include: { barProfile: { select: { businessName: true, city: true } } },
          orderBy: { stopOrder: "asc" },
        },
        orders: { select: { orderNumber: true, status: true } },
      },
      take: 30,
    }),
    prisma.barProfile.findMany({
      orderBy: { businessName: "asc" },
      select: { id: true, businessName: true, city: true },
      take: 100,
    }),
    prisma.wholesaleOrder.findMany({
      where: {
        deliveryRouteId: null,
        status: { in: ["APPROVED", "DISPATCHED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { barProfile: { select: { businessName: true } } },
    }),
  ]);

  const mappedRoutes = routes.map((route) => ({
    id: route.id,
    routeCode: route.routeCode,
    status: route.status,
    plannedDate: route.plannedDate.toISOString(),
    vehiclePlate: route.vehiclePlate,
    stops: route.stops,
    orders: route.orders,
  }));

  const orderOptions = unassignedOrders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    barName: order.barProfile.businessName,
  }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-display font-bold tracking-tight text-white">Rutas de reparto</h1>
        <p className="mt-2 text-slate-400">Planifica entregas wholesale y asigna pedidos a rutas.</p>
      </div>

      <DeliveryRouteForm bars={bars} unassignedOrders={orderOptions} />

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
          Rutas ({mappedRoutes.length})
        </h2>
        <DeliveryRoutesList routes={mappedRoutes} />
      </section>
    </div>
  );
}
