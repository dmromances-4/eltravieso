import Link from "next/link";
import prisma from "@/lib/prisma";
import { MediaAdminList } from "@/components/admin/MediaAdmin";

export const dynamic = "force-dynamic";

export default async function AdminPantallaPage() {
  const items = await prisma.mediaItem.findMany({
    orderBy: { updatedAt: "desc" },
    include: { barProfile: { select: { businessName: true } } },
  });

  const mapped = items.map((i) => ({
    id: i.id,
    title: i.title,
    slug: i.slug,
    kind: i.kind,
    status: i.status,
    updatedAt: i.updatedAt.toISOString(),
    barProfile: i.barProfile,
  }));

  const pending = mapped.filter((i) => i.status === "PENDING");

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-white">Pantalla</h1>
          <p className="mt-2 text-slate-400">Catálogo audiovisual, TMDB, podcasts y moderación de eventos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/pantalla/new" className="rounded-full bg-electric-red px-6 py-3 text-xs font-bold uppercase tracking-widest text-white">
            Nuevo
          </Link>
          <Link href="/admin/pantalla/directo" className="rounded-full border border-white/20 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white">
            Directo
          </Link>
          <Link href="/admin/pantalla/feeds" className="rounded-full border border-white/20 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white">
            Feeds RSS
          </Link>
        </div>
      </div>

      {pending.length > 0 ? (
        <section>
          <h2 className="mb-4 text-xl font-bold text-amber-300">Eventos pendientes ({pending.length})</h2>
          <MediaAdminList items={mapped} pendingOnly />
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 text-xl font-bold text-white">Todo el catálogo</h2>
        <MediaAdminList items={mapped} />
      </section>
    </div>
  );
}
