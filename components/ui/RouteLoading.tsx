export default function RouteLoading({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-electric-yellow/30 border-t-electric-yellow"
        aria-hidden
      />
      <p className="text-sm font-medium uppercase tracking-widest text-slate-400">{label}</p>
    </div>
  );
}
