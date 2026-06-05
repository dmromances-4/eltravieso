import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { exchangeShopifyCode } from "@/lib/integrations/shopify";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login?callbackUrl=/cuenta/integraciones", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const shop = url.searchParams.get("shop");
  const state = url.searchParams.get("state");

  if (!code || !shop || !state) {
    return NextResponse.redirect(
      new URL("/cuenta/integraciones?shopify=error&reason=missing_params", request.url),
    );
  }

  const profile = await prisma.barProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile || !profile.shopifyScopes?.includes(`oauth_state:${state}`)) {
    return NextResponse.redirect(
      new URL("/cuenta/integraciones?shopify=error&reason=invalid_state", request.url),
    );
  }

  try {
    const tokenData = await exchangeShopifyCode(shop, code);

    await prisma.barProfile.update({
      where: { id: profile.id },
      data: {
        shopifyShopName: shop.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        shopifyAccessToken: tokenData.access_token,
        shopifyScopes: tokenData.scope,
        shopifySyncStatus: "idle",
        shopifySyncError: null,
      },
    });

    return NextResponse.redirect(new URL("/cuenta/integraciones?shopify=connected", request.url));
  } catch (error) {
    console.error("[SHOPIFY_OAUTH_CALLBACK]", error);
    return NextResponse.redirect(
      new URL("/cuenta/integraciones?shopify=error&reason=oauth_failed", request.url),
    );
  }
}
