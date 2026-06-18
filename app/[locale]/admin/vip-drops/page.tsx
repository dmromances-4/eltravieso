import VipDropsAdmin from "@/components/admin/VipDropsAdmin";

export const dynamic = "force-dynamic";

export default function AdminVipDropsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold tracking-tight text-white">Drops VIP</h1>
        <p className="mt-2 text-slate-400">
          Configura el producto mensual del Club de la Trastienda y procesa envíos pendientes.
        </p>
      </div>
      <VipDropsAdmin />
    </div>
  );
}
