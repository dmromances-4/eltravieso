import Link from "next/link";
import { CampaignForm } from "@/components/admin/CampaignAdmin";

export const dynamic = "force-dynamic";

export default function AdminCampaignNewPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/campaigns" className="text-sm text-slate-400 hover:text-electric-yellow">
          ← Campañas
        </Link>
        <h1 className="mt-4 text-4xl font-display font-bold tracking-tight text-white">Nueva campaña</h1>
      </div>
      <CampaignForm />
    </div>
  );
}
