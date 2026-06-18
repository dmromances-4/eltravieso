import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-[#FAFAFA] px-6 pt-24 text-center text-slate-900">
      <p className="text-6xl font-display font-bold text-electric-yellow">404</p>
      <h1 className="text-2xl font-display font-bold">Página no encontrada</h1>
      <p className="max-w-md text-sm text-slate-400">
        La ruta que buscas no existe o ha sido movida.
      </p>
      <Link
        href="/"
        className="rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition hover:opacity-90"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
