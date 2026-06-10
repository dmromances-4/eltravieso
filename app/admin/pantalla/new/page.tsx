import Link from "next/link";
import { MediaAdminForm } from "@/components/admin/MediaAdmin";

export default function AdminPantallaNewPage() {
  return (
    <div className="space-y-6">
      <Link href="/admin/pantalla" className="text-sm text-electric-yellow hover:underline">← Pantalla</Link>
      <h1 className="text-3xl font-display font-bold text-white">Nuevo contenido</h1>
      <MediaAdminForm />
    </div>
  );
}
