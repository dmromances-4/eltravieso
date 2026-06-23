/** Skeleton RSC estático — sin client components ni dynamic imports. */
export default function MapaLoading() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] pb-12 pt-28 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8 px-6 sm:px-8">
        <section className="space-y-4">
          <span className="inline-flex h-9 w-40 animate-pulse rounded-pill bg-slate-200" />
          <div className="h-12 w-2/3 max-w-lg animate-pulse rounded-lg bg-slate-200" />
          <div className="h-5 w-full max-w-2xl animate-pulse rounded bg-slate-100" />
        </section>

        <section className="space-y-4">
          <div className="h-12 w-full animate-pulse rounded-card border border-slate-200 bg-white" />
          <div className="rounded-card border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 h-8 w-56 animate-pulse rounded bg-slate-200" />
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <li
                  key={i}
                  className="h-20 animate-pulse rounded-card border border-slate-200 bg-slate-100"
                />
              ))}
            </ul>
          </div>
        </section>

        <div className="flex h-[70vh] animate-pulse items-center justify-center rounded-card border border-slate-200 bg-white text-slate-400 shadow-sm">
          <span className="font-mono text-sm uppercase tracking-widest">Cargando mapa…</span>
        </div>
      </div>
    </main>
  );
}
