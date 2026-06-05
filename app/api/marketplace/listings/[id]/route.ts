import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AdminApiError, adminApiErrorResponse, requireAdminUser } from "@/lib/auth/admin-api";
import { clientSafeErrorMessage } from "@/lib/security/safe-error";

function typeForCategory(category: string): "CONSUMABLE" | "MERCH" | "CONSERVA" {
  if (category === "CONSERVA_LATERIO") return "CONSERVA";
  if (["MERCH", "ROPA", "MATERIAL", "CRISTALERIA"].includes(category)) return "MERCH";
  return "CONSUMABLE";
}

// Aprobar / rechazar un listing (solo ADMIN con 2FA).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminUser();
  } catch (error) {
    return adminApiErrorResponse(error);
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
  } catch (error: unknown) {
    console.error("[LISTING_REVIEW_ERROR]:", error);
    return NextResponse.json(
      { message: clientSafeErrorMessage(error, "Error al revisar el artículo.") },
      { status: 500 },
    );
  }
}
