import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatEuros(cents: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default async function AdminWholesalePage() {
  const orders = await prisma.wholesaleOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      barProfile: { select: { businessName: true, city: true } },
      invoice: { select: { invoiceNumber: true, status: true } },
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-2 text-4xl font-display font-bold tracking-tight text-white">Pedidos mayoristas</h1>
        <p className="text-slate-400">
          Pedidos B2B de bares. El despacho FIFO se ejecuta vía{" "}
          <code className="text-electric-yellow">POST /api/wholesale/dispatch</code>.
        </p>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-[2rem] border border-white/10 bg-[#121212] p-8 text-slate-400">
          Aún no hay pedidos mayoristas.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-[#121212]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">Pedido</th>
                <th className="px-6 py-4">Bar</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Líneas</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Factura</th>
                <th className="px-6 py-4">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-white/5 text-slate-300">
                  <td className="px-6 py-4 font-mono text-white">{order.orderNumber}</td>
                  <td className="px-6 py-4">
                    <span className="text-white">{order.barProfile.businessName}</span>
                    {order.barProfile.city ? (
                      <span className="mt-0.5 block text-xs text-slate-500">{order.barProfile.city}</span>
                    ) : null}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-white/5 px-2 py-1 text-xs font-bold uppercase tracking-wider text-electric-blue">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{order._count.items}</td>
                  <td className="px-6 py-4 text-white">{formatEuros(order.totalCents)}</td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {order.invoice ? (
                      <>
                        {order.invoice.invoiceNumber}
                        <span className="ml-2 text-slate-500">({order.invoice.status})</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {order.createdAt.toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link href="/admin" className="text-sm font-semibold text-electric-yellow hover:text-white">
        ← Volver al dashboard
      </Link>
    </div>
  );
}
