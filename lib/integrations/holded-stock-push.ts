import prisma from "@/lib/prisma";
import { resolveHoldedApiKey } from "@/lib/integrations/holded-catalog";

const HOLDED_STOCK_URL = "https://api.holded.com/api/invoicing/v1/products";

export async function pushStockToHolded(
  holdedProductId: string,
  stock: number,
  profileApiKey?: string | null,
) {
  const apiKey = resolveHoldedApiKey(profileApiKey);
  if (!apiKey) {
    throw new Error("Holded API key no configurada para push de stock.");
  }

  const response = await fetch(`${HOLDED_STOCK_URL}/${encodeURIComponent(holdedProductId)}/stock`, {
    method: "POST",
    headers: {
      accept: "application/json",
      key: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ stock: Math.max(0, Math.round(stock)) }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Holded stock push error (${response.status}): ${body}`);
  }

  return body ? JSON.parse(body) : { ok: true };
}

export async function pushVariantStockToHolded(
  holdedProductId: string,
  stock: number,
  barProfileId: string,
) {
  const profile = await prisma.barProfile.findUnique({
    where: { id: barProfileId },
    select: { holdedApiKey: true },
  });

  return pushStockToHolded(holdedProductId, stock, profile?.holdedApiKey);
}
