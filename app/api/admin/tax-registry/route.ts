import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";

export async function POST(request: Request) {
  try {
    await requireAdminUser();
    const body = await request.json();

    const productId = String(body.productId ?? "").trim();
    const caeCode = String(body.caeCode ?? "").trim();
    const fiscalPeriod = String(body.fiscalPeriod ?? "").trim();
    const declarationDate = String(body.declarationDate ?? "").trim();

    if (!productId || !caeCode || !fiscalPeriod || !declarationDate) {
      return NextResponse.json(
        { message: "Producto, CAE, periodo fiscal y fecha son obligatorios." },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ message: "Producto no encontrado." }, { status: 404 });
    }

    const batchId = body.batchId ? String(body.batchId).trim() || null : null;
    if (batchId) {
      const batch = await prisma.productionBatch.findUnique({ where: { id: batchId } });
      if (!batch) {
        return NextResponse.json({ message: "Lote no encontrado." }, { status: 404 });
      }
    }

    const exciseTaxCents = Math.round(Number(body.exciseTaxCents ?? 0));
    const taxRateBps = Math.round(Number(body.taxRateBps ?? 800));
    const declaredLiters = Math.round(Number(body.declaredLiters ?? 0));
    const declaredAbv = Math.round(Number(body.declaredAbv ?? 0));

    const entry = await prisma.liquorsTaxRegistry.create({
      data: {
        productId,
        batchId,
        caeCode,
        sealNumber: body.sealNumber ? String(body.sealNumber).trim() || null : null,
        exciseTaxCents,
        taxRateBps,
        declaredLiters,
        declaredAbv,
        declarationDate: new Date(declarationDate),
        fiscalPeriod,
        documentRef: body.documentRef ? String(body.documentRef).trim() || null : null,
        notes: body.notes ? String(body.notes).trim() || null : null,
      },
      include: {
        product: { select: { title: true } },
        batch: { select: { batchCode: true } },
      },
    });

    return NextResponse.json({ entry, message: "Declaración fiscal registrada." });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
