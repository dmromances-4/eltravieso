import RecipeAuditDetail from "@/components/admin/RecipeAuditDetail";

export const dynamic = "force-dynamic";

type PageProps = { params: { id: string } };

export default function RecipeAuditDetailPage({ params }: PageProps) {
  return <RecipeAuditDetail recipeId={decodeURIComponent(params.id)} />;
}
