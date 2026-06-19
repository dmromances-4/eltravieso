import { NextResponse } from "next/server";
import { logServerError } from '@/lib/security/safe-error';
import prisma from "@/lib/prisma";
import { verifyShopifyWebhookHmac, syncShopifyCatalog } from "@/lib/integrations/shopify";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  const topic = request.headers.get("x-shopify-topic");
  const shopDomain = request.headers.get("x-shopify-shop-domain");

  if (!verifyShopifyWebhookHmac(rawBody, hmac)) {
    return NextResponse.json({ message: "Invalid HMAC" }, { status: 401 });
  }

  if (!shopDomain) {
    return NextResponse.json({ message: "Missing shop domain" }, { status: 400 });
  }

  const profile = await prisma.barProfile.findFirst({
    where: { shopifyShopName: shopDomain },
  });

  if (!profile) {
    return NextResponse.json({ message: "Bar profile not found" }, { status: 404 });
  }

  const productTopics = ["products/create", "products/update", "products/delete"];
  if (topic && productTopics.includes(topic)) {
    try {
      await syncShopifyCatalog(profile.id);
    } catch (error) {
      logServerError('shopify-webhook', error);
    }
  }

  return NextResponse.json({ ok: true });
}
