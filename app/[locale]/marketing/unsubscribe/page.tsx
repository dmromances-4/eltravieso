import { Link } from "@/i18n/navigation";

type PageProps = {
  searchParams: { token?: string; ok?: string; error?: string };
};

export default function MarketingUnsubscribePage({ searchParams }: PageProps) {
  const ok = searchParams.ok === "1";
  const error = searchParams.error;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="font-serif text-3xl text-white">Comunicaciones por email</h1>
      {ok ? (
        <>
          <p className="mt-6 text-slate-300">
            Te has dado de baja de las comunicaciones por email. No recibirás más campañas de marketing.
          </p>
          <Link
            href="/"
            className="mt-8 rounded-full border border-electric-yellow/40 px-6 py-3 text-sm font-bold uppercase tracking-widest text-electric-yellow hover:bg-electric-yellow/10"
          >
            Volver al inicio
          </Link>
        </>
      ) : (
        <>
          <p className="mt-6 text-slate-400">
            {error === "invalid"
              ? "El enlace de baja no es válido o ha caducado."
              : "Abre el enlace de baja desde el email que recibiste."}
          </p>
          <Link href="/cuenta" className="mt-8 text-sm text-electric-yellow underline">
            Ir a mi cuenta
          </Link>
        </>
      )}
    </main>
  );
}
