import prisma from "@/lib/prisma";
import { upsertCatalogItem } from "@/lib/integrations/catalog-upsert";

type SquareMoney = { amount?: number; currency?: string };
type SquareCatalogItem = {
  type: string;
  id: string;
  item_data?: {
    name?: string;
    description?: string;
    variations?: Array<{
      id: string;
      item_variation_data?: {
        name?: string;
        sku?: string;
        price_money?: SquareMoney;
      };
    }>;
  };
};

function getSquareBaseUrl() {
  return process.env.SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

async function fetchSquareCatalog(accessToken: string): Promise<SquareCatalogItem[]> {
  const objects: SquareCatalogItem[] = [];
  let cursor: string | undefined;

  do {
    const response: Response = await fetch(`${getSquareBaseUrl()}/v2/catalog/list`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": "2024-10-17",
      },
      body: JSON.stringify({
        types: "ITEM",
        cursor,
      }),
    });

    const body = await response.text();
    if (!response.ok) {
      throw new Error(`Square catalog API error (${response.status}): ${body}`);
    }

    const parsed = JSON.parse(body) as {
      objects?: SquareCatalogItem[];
      cursor?: string;
    };
    objects.push(...(parsed.objects ?? []));
    cursor = parsed.cursor;
  } while (cursor);

  return objects;
}

export async function syncSquareCatalog(barProfileId: string) {
  const profile = await prisma.barProfile.findUnique({ where: { id: barProfileId } });
  if (!profile) throw new Error("Perfil de bar no encontrado.");

  const accessToken = profile.squareAccessToken?.trim();
  if (!accessToken) {
    throw new Error("Falta access token de Square. Conéctalo desde integraciones.");
  }

  await prisma.barProfile.update({
    where: { id: barProfileId },
    data: { squareSyncStatus: "syncing", squareSyncError: null },
  });

  try {
    const items = await fetchSquareCatalog(accessToken);
    let synced = 0;

    for (const item of items) {
      if (item.type !== "ITEM" || !item.item_data) continue;
      const variation = item.item_data.variations?.[0];
      if (!variation) continue;

      const sku = variation.item_variation_data?.sku?.trim() || variation.id;
      const priceCents = variation.item_variation_data?.price_money?.amount ?? 0;

      await upsertCatalogItem({
        title: item.item_data.name ?? "Producto Square",
        slugBase: item.item_data.name ?? variation.id,
        sku,
        priceCents,
        stock: 0,
        description: item.item_data.description ?? null,
        barProfileId,
        metadata: {
          squareItemId: item.id,
          squareVariationId: variation.id,
          squareLocationId: profile.squareLocationId,
          barProfileId,
          source: "square",
        },
      });
      synced += 1;
    }

    await prisma.barProfile.update({
      where: { id: barProfileId },
      data: {
        squareSyncStatus: "ok",
        squareLastSyncAt: new Date(),
        squareSyncError: null,
        tpvProvider: profile.tpvProvider ?? "square",
      },
    });

    return { synced };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de sincronización Square";
    await prisma.barProfile.update({
      where: { id: barProfileId },
      data: { squareSyncStatus: "error", squareSyncError: message },
    });
    throw error;
  }
}
