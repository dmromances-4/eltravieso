import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireAdminUser();

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { variants: true },
    });

    if (!product) {
      return NextResponse.json({ message: "Producto no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await requireAdminUser();
    const body = await request.json();

    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      include: { variants: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Producto no encontrado." }, { status: 404 });
    }

    const title = body.title != null ? String(body.title).trim() : existing.title;
    const description = body.description != null ? String(body.description).trim() || null : existing.description;
    const imageUrl = body.imageUrl != null ? (body.imageUrl ? String(body.imageUrl) : null) : existing.imageUrl;
    const isActive = body.isActive != null ? Boolean(body.isActive) : existing.isActive;

    const product = await prisma.product.update({
      where: { id: params.id },
      data: { title, description, imageUrl, isActive },
      include: { variants: true },
    });

    if (body.variant && existing.variants[0]) {
      const variant = existing.variants[0];
      const priceCents = body.variant.priceCents != null ? Number(body.variant.priceCents) : variant.priceCents;
      const stock = body.variant.stock != null ? Number(body.variant.stock) : variant.stock;

      await prisma.productVariant.update({
        where: { id: variant.id },
        data: {
          priceCents: Number.isFinite(priceCents) ? Math.round(priceCents) : variant.priceCents,
          stock: Number.isFinite(stock) ? Math.round(stock) : variant.stock,
        },
      });
    }

    const updated = await prisma.product.findUnique({
      where: { id: params.id },
      include: { variants: true },
    });

    return NextResponse.json({ product: updated ?? product, message: "Producto actualizado." });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
