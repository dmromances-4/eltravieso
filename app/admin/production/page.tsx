import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminProductionPage() {
  const batches = await prisma.productionBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      _count: { select: { wholesaleOrderItems: true } },
    },
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-2 text-4xl font-display font-bold tracking-tight text-white">Lotes de producción</h1>
        <p className="text-slate-400">
          Inventario FIFO para despacho mayorista. Los lotes con unidades disponibles alimentan{" "}
          <code className="text-electric-yellow">/api/wholesale/dispatch</code>.
        </p>
      </div>

      {batches.length === 0 ? (
        <p className="rounded-[2rem] border border-white/10 bg-[#121212] p-8 text-slate-400">
          No hay lotes registrados.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-[#121212]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">Lote</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Unidades</th>
                <th className="px-6 py-4">Restantes</th>
                <th className="px-6 py-4">Despachos</th>
                <th className="px-6 py-4">Embotellado</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id} className="border-b border-white/5 text-slate-300">
                  <td className="px-6 py-4 font-mono text-white">{batch.batchCode}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-white/5 px-2 py-1 text-xs font-bold uppercase tracking-wider text-electric-yellow">
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{batch.totalUnits}</td>
                  <td className="px-6 py-4 text-white">{batch.remainingUnits}</td>
                  <td className="px-6 py-4">{batch._count.wholesaleOrderItems}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {batch.bottlingDate
                      ? batch.bottlingDate.toLocaleDateString("es-ES")
                      : "—"}
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
