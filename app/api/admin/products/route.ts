import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";

export async function GET() {
  try {
    await requireAdminUser();

    const products = await prisma.product.findMany({
      include: {
        variants: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
