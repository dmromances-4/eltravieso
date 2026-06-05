import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function typeForCategory(category: string): "CONSUMABLE" | "MERCH" | "CONSERVA" {
  if (category === "CONSERVA_LATERIO") return "CONSERVA";
  if (["MERCH", "ROPA", "MATERIAL", "CRISTALERIA"].includes(category)) return "MERCH";
  return "CONSUMABLE";
}

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

// Aprobar / rechazar un listing (solo ADMIN).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  if (!(await isAdmin(session.user.id))) {
    return NextResponse.json({ message: "Solo administradores pueden revisar artículos." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const action = String(body.action ?? "");
    const notes = body.notes ? String(body.notes).trim() : null;

    const listing = await prisma.listing.findUnique({ where: { id: params.id } });
    if (!listing) {
      return NextResponse.json({ message: "Artículo no encontrado." }, { status: 404 });
    }

    if (action === "reject") {
      const updated = await prisma.listing.update({
        where: { id: listing.id },
        data: { status: "REJECTED", reviewNotes: notes },
      });
      return NextResponse.json({ message: "Artículo rechazado.", listing: updated });
    }

    if (action === "approve") {
      if (listing.status === "APPROVED" && listing.createdProductId) {
        return NextResponse.json({ message: "El artículo ya estaba aprobado.", listing });
      }

      // Garantizar slug de Product único.
      let productSlug = listing.slug;
      let n = 1;
      while (await prisma.product.findUnique({ where: { slug: productSlug } })) {
        productSlug = `${listing.slug}-${n++}`;
      }

      const result = await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            title: listing.title,
            slug: productSlug,
            description: listing.description,
            type: typeForCategory(listing.category) as any,
            category: listing.category,
            channel: "B2C",
            imageUrl: listing.imageUrl,
            isActive: true,
            metadata: { source: "marketplace", listingId: listing.id, sellerId: listing.sellerId },
          },
        });

        await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: `MK-${productSlug}`.slice(0, 60),
            format: listing.format,
            channel: "B2C",
            priceCents: listing.priceCents,
            minOrderQty: 1,
            stock: 0,
          },
        });

        const updated = await tx.listing.update({
          where: { id: listing.id },
          data: { status: "APPROVED", reviewNotes: notes, createdProductId: product.id },
        });

        return { product, listing: updated };
      });

      return NextResponse.json({ message: "Artículo aprobado y publicado en la tienda.", ...result });
    }

    return NextResponse.json({ message: "Acción no válida (approve | reject)." }, { status: 400 });
  } catch (error: any) {
    console.error("[LISTING_REVIEW_ERROR]:", error);
    return NextResponse.json({ message: error.message || "Error al revisar el artículo." }, { status: 500 });
  }
}
