import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ProductEditForm from "@/components/admin/ProductEditForm";

export const dynamic = "force-dynamic";

export default async function AdminProductEditPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { variants: true },
  });

  if (!product) notFound();

  return (
    <div className="space-y-8">
      <Link
        href="/admin/products"
        className="inline-flex text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-electric-yellow"
      >
        ← Volver a productos
      </Link>
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Editar producto</h1>
        <p className="mt-2 text-slate-400">{product.title}</p>
      </div>
      <ProductEditForm product={product} />
    </div>
  );
}
