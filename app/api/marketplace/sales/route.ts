import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sales = await prisma.orderSplitLine.findMany({
    where: {
      partnerId: session.user.id,
      partnerCents: { gt: 0 },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      order: { select: { orderNumber: true, status: true } },
    },
  });

  const productIds = [...new Set(sales.map((s) => s.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  const enriched = sales.map((row) => ({
    ...row,
    product: productById.get(row.productId) ?? { title: "Producto" },
  }));

  const totals = sales.reduce(
    (acc, row) => {
      acc.grossCents += row.grossCents;
      acc.partnerCents += row.partnerCents;
      if (!row.settled) acc.pendingCents += row.partnerCents;
      return acc;
    },
    { grossCents: 0, partnerCents: 0, pendingCents: 0 },
  );

  return NextResponse.json({ sales: enriched, totals });
}
