import prisma from "@/lib/prisma";
import ListingReview from "@/components/admin/ListingReview";

export const dynamic = "force-dynamic";

export default async function AdminMarketplacePage() {
  const [pending, recent] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { seller: { select: { email: true } } },
    }),
    prisma.listing.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { seller: { select: { email: true } } },
    }),
  ]);

  const mapped = pending.map((l) => ({
    id: l.id,
    title: l.title,
    slug: l.slug,
    category: l.category,
    priceCents: l.priceCents,
    status: l.status,
    imageUrl: l.imageUrl,
    description: l.description,
    sellerEmail: l.seller?.email ?? null,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-display font-bold tracking-tight text-white mb-2">Marketplace</h1>
        <p className="text-slate-400">Revisa los artículos enviados por usuarios. Al aprobar se publican en la tienda.</p>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
          Pendientes ({mapped.length})
        </h2>
        <ListingReview listings={mapped} />
      </section>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">Historial reciente</h2>
        {recent.length === 0 ? (
          <p className="text-slate-400">Sin artículos revisados todavía.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#121212] px-4 py-3"
              >
                <span className="text-white">{l.title}</span>
                <span className="text-xs text-slate-500">
                  {l.seller?.email} ·{" "}
                  <span className={l.status === "APPROVED" ? "text-emerald-400" : "text-red-400"}>
                    {l.status === "APPROVED" ? "Publicado" : "Rechazado"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
