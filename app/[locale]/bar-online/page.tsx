import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import BarOnlineLobby from "@/components/bar-online/BarOnlineLobby";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bar Online | Vermut El Travieso",
  description:
    "Salas en directo: chat, videollamadas y catas en streaming con la comunidad de El Travieso.",
};

export default async function BarOnlinePage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen bg-night px-6 pb-24 pt-32 text-white sm:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="border-4 border-black bg-zinc-950 p-8 shadow-[8px_8px_0px_#000000]">
          <span className="inline-block border-2 border-black bg-electric-yellow px-3 py-1 text-xs font-bold uppercase tracking-widest text-black">
            Directo · Barcelona
          </span>
          <h1 className="mt-4 font-mono text-4xl font-bold uppercase tracking-widest text-white sm:text-5xl">
            Bar Online
          </h1>
          <p className="mt-3 max-w-2xl font-mono text-sm text-slate-400">
            Entra en una sala para charlar, hacer una videollamada o seguir una cata
            en directo. La presencia es en tiempo real y no se almacena.
          </p>
        </header>

        {session?.user?.id ? (
          <BarOnlineLobby canCreate isVip={Boolean(session.user.isVip)} />
        ) : (
          <div className="space-y-8">
            <div className="border-4 border-black bg-electric-red p-6 font-mono font-bold text-white shadow-[6px_6px_0px_#000000]">
              Inicia sesión para abrir salas y unirte a las videollamadas.
            </div>
            <BarOnlineLobby canCreate={false} />
          </div>
        )}
      </div>
    </main>
  );
}
