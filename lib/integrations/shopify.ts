import { createHmac, timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils/slug";

const SHOPIFY_API_VERSION = "2024-10";

export function getShopifyConfig() {
  const clientId = process.env.SHOPIFY_CLIENT_ID ?? "";
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return { clientId, clientSecret, appUrl };
}

export function buildShopifyOAuthUrl(shop: string, state: string) {
  const { clientId, appUrl } = getShopifyConfig();
  const redirectUri = `${appUrl}/api/integrations/shopify/callback`;
  const scopes = "read_products,read_inventory";
  const normalizedShop = shop.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });

  return `https://${normalizedShop}/admin/oauth/authorize?${params.toString()}`;
}

export async function exchangeShopifyCode(shop: string, code: string) {
  const { clientId, clientSecret } = getShopifyConfig();
  const normalizedShop = shop.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const res = await fetch(`https://${normalizedShop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify OAuth failed: ${text}`);
  }

  return res.json() as Promise<{
    access_token: string;
    scope: string;
  }>;
}

export function verifyShopifyWebhookHmac(rawBody: string, hmacHeader: string | null): boolean {
  const secret = process.env.SHOPIFY_CLIENT_SECRET ?? "";
  if (!hmacHeader || !secret) return false;

  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");

  try {
    const a = Buffer.from(digest);
    const b = Buffer.from(hmacHeader);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return digest === hmacHeader;
  }
}

type ShopifyProduct = {
  id: number;
  title: string;
  body_html: string | null;
  handle: string;
  variants: Array<{
    id: number;
    sku: string | null;
    price: string;
    inventory_quantity: number;
  }>;
  image?: { src: string } | null;
};

async function fetchShopifyProducts(shop: string, accessToken: string): Promise<ShopifyProduct[]> {
  const normalizedShop = shop.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const products: ShopifyProduct[] = [];
  let url: string | null =
    `https://${normalizedShop}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=50`;

  while (url) {
    const currentUrl = url;
    const res: Response = await fetch(currentUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Shopify products fetch failed: ${text}`);
    }

    const data = (await res.json()) as { products: ShopifyProduct[] };
    products.push(...data.products);

    const linkHeader = res.headers.get("link");
    let nextUrl: string | null = null;
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      nextUrl = nextMatch?.[1] ?? null;
    }
    url = nextUrl;
  }

  return products;
}

async function upsertShopifyProduct(product: ShopifyProduct, barProfileId: string) {
  const variant = product.variants[0];
  if (!variant) return;

  const slug = slugify(product.handle || product.title);
  const sku = variant.sku || `SHOPIFY-${variant.id}`;
  const priceCents = Math.round(parseFloat(variant.price) * 100);

  const existingVariant = await prisma.productVariant.findUnique({
    where: { sku },
    include: { product: true },
  });

  if (existingVariant) {
    await prisma.product.update({
      where: { id: existingVariant.productId },
      data: {
        title: product.title,
        description: product.body_html?.replace(/<[^>]+>/g, " ").trim() || null,
        imageUrl: product.image?.src ?? existingVariant.product.imageUrl,
        metadata: {
          shopifyProductId: product.id,
          shopifyVariantId: variant.id,
          barProfileId,
        },
      },
    });
    await prisma.productVariant.update({
      where: { id: existingVariant.id },
      data: {
        priceCents,
        stock: variant.inventory_quantity ?? existingVariant.stock,
      },
    });
    return;
  }

  await prisma.product.create({
    data: {
      title: product.title,
      slug: `${slug}-${variant.id}`,
      description: product.body_html?.replace(/<[^>]+>/g, " ").trim() || null,
      imageUrl: product.image?.src ?? null,
      category: "INGREDIENTE",
      type: "CONSUMABLE",
      channel: "B2B",
      metadata: {
        shopifyProductId: product.id,
        shopifyVariantId: variant.id,
        barProfileId,
      },
      variants: {
        create: {
          sku,
          format: "UNIT",
          channel: "B2B",
          priceCents,
          stock: variant.inventory_quantity ?? 0,
        },
      },
    },
  });
}

export async function syncShopifyCatalog(barProfileId: string) {
  const profile = await prisma.barProfile.findUnique({ where: { id: barProfileId } });
  if (!profile?.shopifyShopName) {
    throw new Error("Shopify no configurado para este local.");
  }

  const accessToken = profile.shopifyAccessToken ?? profile.shopifyApiKey;
  if (!accessToken) {
    throw new Error("Falta token de acceso Shopify. Conecta vía OAuth o API key.");
  }

  await prisma.barProfile.update({
    where: { id: barProfileId },
    data: { shopifySyncStatus: "syncing", shopifySyncError: null },
  });

  try {
    const products = await fetchShopifyProducts(profile.shopifyShopName, accessToken);

    for (const product of products) {
      await upsertShopifyProduct(product, barProfileId);
    }

    await prisma.barProfile.update({
      where: { id: barProfileId },
      data: {
        shopifySyncStatus: "ok",
        shopifyLastSyncAt: new Date(),
        shopifySyncError: null,
      },
    });

    return { synced: products.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de sincronización";
    await prisma.barProfile.update({
      where: { id: barProfileId },
      data: {
        shopifySyncStatus: "error",
        shopifySyncError: message,
      },
    });
    throw error;
  }
}
