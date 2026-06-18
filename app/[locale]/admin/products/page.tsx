import { Link } from "@/i18n/navigation";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      variants: {
        where: { isActive: true },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold tracking-tight text-white">Productos</h1>
        <p className="mt-2 text-slate-400">Gestiona el catálogo de la tienda oficial.</p>
      </div>

      {products.length === 0 ? (
        <p className="text-slate-400">No hay productos. Usa los scripts de seed o importación.</p>
      ) : (
        <ul className="space-y-3">
          {products.map((product) => {
            const variant = product.variants[0];
            return (
              <li
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#121212] px-5 py-4"
              >
                <div>
                  <p className="font-semibold text-white">{product.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {product.slug} · {product.category} ·{" "}
                    {variant ? `${(variant.priceCents / 100).toFixed(2)} € · Stock ${variant.stock}` : "Sin variante"} ·{" "}
                    {product.isActive ? (
                      <span className="text-emerald-400">Activo</span>
                    ) : (
                      <span className="text-red-400">Inactivo</span>
                    )}
                  </p>
                </div>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="rounded-full border border-electric-yellow/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-electric-yellow hover:bg-electric-yellow/10"
                >
                  Editar
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
