"use client";

export default function RouteError({
  error,
  reset,
  title = "Algo salió mal",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-display font-bold text-white">{title}</h2>
      <p className="text-sm text-slate-400">{error.message || "No pudimos cargar esta página."}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition hover:opacity-90"
      >
        Reintentar
      </button>
    </div>
  );
}
