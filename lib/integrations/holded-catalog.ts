import prisma from "@/lib/prisma";
import { upsertCatalogItem } from "@/lib/integrations/catalog-upsert";

const HOLDED_PRODUCTS_URL = "https://api.holded.com/api/invoicing/v1/products";

export type HoldedProductPayload = {
  id: string;
  name: string;
  desc?: string;
  price?: number;
  stock?: number;
  sku?: string;
  code?: string;
};

export function resolveHoldedApiKey(profileKey?: string | null) {
  return profileKey?.trim() || process.env.HOLDED_API_KEY?.trim() || "";
}

export async function upsertHoldedProduct(barProfileId: string, product: HoldedProductPayload) {
  const sku = product.sku || product.code || `HOLDED-${product.id}`;
  const priceCents = Math.round((product.price ?? 0) * 100);
  const stock = Math.round(product.stock ?? 0);

  const result = await upsertCatalogItem({
    title: product.name,
    slugBase: product.name,
    sku,
    priceCents,
    stock,
    description: product.desc ?? null,
    barProfileId,
    metadata: {
      holdedProductId: product.id,
      barProfileId,
      source: "holded",
    },
  });

  return { ...result, sku, stock };
}

async function fetchHoldedProducts(apiKey: string): Promise<HoldedProductPayload[]> {
  const response = await fetch(HOLDED_PRODUCTS_URL, {
    headers: {
      accept: "application/json",
      key: apiKey,
    },
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Holded products API error (${response.status}): ${body}`);
  }

  const parsed = body ? JSON.parse(body) : [];
  if (Array.isArray(parsed)) return parsed as HoldedProductPayload[];
  if (Array.isArray((parsed as { data?: HoldedProductPayload[] }).data)) {
    return (parsed as { data: HoldedProductPayload[] }).data;
  }
  return [];
}

export async function syncHoldedCatalog(barProfileId: string) {
  const profile = await prisma.barProfile.findUnique({ where: { id: barProfileId } });
  if (!profile) throw new Error("Perfil de bar no encontrado.");

  const apiKey = resolveHoldedApiKey(profile.holdedApiKey);
  if (!apiKey) {
    throw new Error("Configura HOLDED_API_KEY en el servidor o guarda una API key de Holded.");
  }

  await prisma.barProfile.update({
    where: { id: barProfileId },
    data: { holdedSyncStatus: "syncing", holdedSyncError: null },
  });

  try {
    const products = await fetchHoldedProducts(apiKey);
    let synced = 0;

    for (const product of products) {
      await upsertHoldedProduct(barProfileId, product);
      synced += 1;
    }

    await prisma.barProfile.update({
      where: { id: barProfileId },
      data: {
        holdedSyncStatus: "ok",
        holdedLastSyncAt: new Date(),
        holdedSyncError: null,
      },
    });

    return { synced };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de sincronización Holded";
    await prisma.barProfile.update({
      where: { id: barProfileId },
      data: { holdedSyncStatus: "error", holdedSyncError: message },
    });
    throw error;
  }
}

export function isHoldedConfigured(profileKey?: string | null) {
  return Boolean(resolveHoldedApiKey(profileKey));
}
