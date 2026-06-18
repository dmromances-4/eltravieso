import BarSettingsForm from "@/components/account/BarSettingsForm";

export default function BarSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mono text-3xl font-bold uppercase tracking-widest text-white">
          🏪 Mi Establecimiento
        </h1>
        <p className="mt-2 font-mono text-sm text-slate-400">
          Ficha del local, telemetría de stock para pedidos B2B y widgets de reservas integrados.
        </p>
      </div>

      <div className="border-4 border-black bg-zinc-950 p-8 shadow-[8px_8px_0px_#000000]">
        <BarSettingsForm />
      </div>
    </div>
  );
}
