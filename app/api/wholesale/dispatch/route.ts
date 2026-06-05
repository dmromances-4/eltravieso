import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { dispatchWholesaleOrder } from "@/lib/wholesale/fifo-dispatch";
import { assertWholesaleDispatchAccess, AuthorizationError } from "@/lib/security/authorization";
import { clientSafeErrorMessage } from "@/lib/security/safe-error";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { barProfileId, lines, createInvoice = true } = body;

  if (!barProfileId || !Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json(
      { message: "Datos de despacho incompletos." },
      { status: 400 },
    );
  }

  const barProfile = await prisma.barProfile.findUnique({
    where: { id: barProfileId },
    select: { userId: true },
  });

  if (!barProfile) {
    return NextResponse.json({ message: "Perfil de bar no encontrado." }, { status: 404 });
  }

  try {
    await assertWholesaleDispatchAccess(session.user.id, barProfile.userId);

    const result = await dispatchWholesaleOrder(barProfileId, lines, {
      createInvoice,
      dueDays: 30,
      invoiceStatus: "DRAFT",
      notes: `Factura emitida automáticamente para el pedido mayorista del local ${barProfileId}`,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("[WHOLESALE_DISPATCH_ERROR]:", error);
    return NextResponse.json(
      { message: clientSafeErrorMessage(error, "Error al despachar el pedido mayorista.") },
      { status: 500 },
    );
  }
}
