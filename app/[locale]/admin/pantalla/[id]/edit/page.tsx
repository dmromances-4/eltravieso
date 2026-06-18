import { Link } from "@/i18n/navigation";
import { MediaAdminForm } from "@/components/admin/MediaAdmin";

type PageProps = { params: { id: string } };

export default function AdminPantallaEditPage({ params }: PageProps) {
  return (
    <div className="space-y-6">
      <Link href="/admin/pantalla" className="text-sm text-electric-yellow hover:underline">← Pantalla</Link>
      <h1 className="text-3xl font-display font-bold text-white">Editar contenido</h1>
      <MediaAdminForm itemId={params.id} />
    </div>
  );
}
