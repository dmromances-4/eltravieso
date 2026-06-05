import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { syncShopifyCatalog } from "@/lib/integrations/shopify";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const profile = await prisma.barProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ message: "Configura tu local primero." }, { status: 400 });
    }

    const result = await syncShopifyCatalog(profile.id);
    return NextResponse.json({
      message: `Sincronizados ${result.synced} productos desde Shopify.`,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al sincronizar.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
