import prisma from "@/lib/prisma";
import TaxRegistryForm from "@/components/admin/TaxRegistryForm";

export const dynamic = "force-dynamic";

export default async function AdminTaxRegistryPage() {
  const [entries, products, batches] = await Promise.all([
    prisma.liquorsTaxRegistry.findMany({
      orderBy: { declarationDate: "desc" },
      include: {
        product: { select: { title: true, slug: true } },
        batch: { select: { batchCode: true } },
      },
      take: 50,
    }),
    prisma.product.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
      take: 100,
    }),
    prisma.productionBatch.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, batchCode: true },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold tracking-tight text-white">Registro fiscal</h1>
        <p className="mt-2 text-slate-400">Declaraciones de impuestos especiales sobre bebidas alcohólicas.</p>
      </div>

      {products.length > 0 ? (
        <TaxRegistryForm products={products} batches={batches} />
      ) : (
        <p className="text-slate-400">Crea productos antes de registrar declaraciones fiscales.</p>
      )}

      {entries.length === 0 ? (
        <p className="text-slate-400">No hay declaraciones registradas.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-[#121212] text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Lote</th>
                <th className="px-4 py-3">CAE</th>
                <th className="px-4 py-3">Periodo</th>
                <th className="px-4 py-3">Impuesto</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-white/5 bg-[#0f0f0f]">
                  <td className="px-4 py-3 text-white">{entry.product.title}</td>
                  <td className="px-4 py-3 text-slate-400">{entry.batch?.batchCode ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{entry.caeCode}</td>
                  <td className="px-4 py-3 text-slate-400">{entry.fiscalPeriod}</td>
                  <td className="px-4 py-3 text-electric-yellow">
                    {(entry.exciseTaxCents / 100).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(entry.declarationDate).toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
