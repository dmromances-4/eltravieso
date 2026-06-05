import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildShopifyOAuthUrl, getShopifyConfig } from "@/lib/integrations/shopify";
import { randomBytes } from "crypto";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { clientId } = getShopifyConfig();
  if (!clientId) {
    return NextResponse.json(
      { message: "Configura SHOPIFY_CLIENT_ID y SHOPIFY_CLIENT_SECRET en el servidor." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop")?.trim();

  if (!shop) {
    return NextResponse.json({ message: "Parámetro shop requerido." }, { status: 400 });
  }

  const profile = await prisma.barProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return NextResponse.json(
      { message: "Primero configura tu local en Mi local." },
      { status: 400 },
    );
  }

  const state = randomBytes(16).toString("hex");
  await prisma.barProfile.update({
    where: { id: profile.id },
    data: {
      shopifyShopName: shop.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      shopifyScopes: `oauth_state:${state}`,
    },
  });

  const oauthUrl = buildShopifyOAuthUrl(shop, state);
  return NextResponse.redirect(oauthUrl);
}
