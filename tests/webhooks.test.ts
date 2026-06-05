import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { verifyTpvSignature } from "../lib/tpv/verify-signature";
import { verifyShopifyWebhookHmac } from "../lib/integrations/shopify";
import {
  parseHoldedWebhookEvent,
  verifyHoldedWebhookSignature,
  findBarProfileForHoldedWebhook,
} from "../lib/integrations/holded-webhook";
import { checkRateLimit } from "../lib/rate-limit";

describe("verifyTpvSignature", () => {
  it("accepts valid hex HMAC signatures", () => {
    const secret = "tpv-secret-token";
    const body = JSON.stringify({ sku: "VT-075-ROJO", qty: 2 });
    const signature = createHmac("sha256", secret).update(body).digest("hex");

    expect(verifyTpvSignature(body, signature, secret)).toBe(true);
  });

  it("rejects invalid signatures", () => {
    const body = JSON.stringify({ sku: "VT-075-ROJO", qty: 2 });
    expect(verifyTpvSignature(body, "deadbeef", "tpv-secret-token")).toBe(false);
  });

  it("rejects missing secret", () => {
    const body = "{}";
    const signature = createHmac("sha256", "secret").update(body).digest("hex");
    expect(verifyTpvSignature(body, signature, "")).toBe(false);
  });
});

describe("verifyShopifyWebhookHmac", () => {
  const originalSecret = process.env.SHOPIFY_CLIENT_SECRET;

  it("accepts valid base64 HMAC signatures", () => {
    process.env.SHOPIFY_CLIENT_SECRET = "shopify-shared-secret";
    const body = JSON.stringify({ id: 1, title: "Vermut" });
    const hmac = createHmac("sha256", process.env.SHOPIFY_CLIENT_SECRET)
      .update(body, "utf8")
      .digest("base64");

    expect(verifyShopifyWebhookHmac(body, hmac)).toBe(true);
    process.env.SHOPIFY_CLIENT_SECRET = originalSecret;
  });

  it("rejects tampered payloads", () => {
    process.env.SHOPIFY_CLIENT_SECRET = "shopify-shared-secret";
    const body = JSON.stringify({ id: 1, title: "Vermut" });
    expect(verifyShopifyWebhookHmac(body, "invalid-hmac")).toBe(false);
    process.env.SHOPIFY_CLIENT_SECRET = originalSecret;
  });
});

describe("verifyHoldedWebhookSignature", () => {
  it("accepts valid hex HMAC signatures", () => {
    const secret = "holded-webhook-secret";
    const body = JSON.stringify({ event: "stock.updated", product: { id: "p1", stock: 4 } });
    const signature = createHmac("sha256", secret).update(body).digest("hex");

    expect(verifyHoldedWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("rejects invalid signatures", () => {
    const body = JSON.stringify({ event: "product.updated" });
    expect(verifyHoldedWebhookSignature(body, "bad", "holded-webhook-secret")).toBe(false);
  });
});

describe("parseHoldedWebhookEvent", () => {
  it("parses stock.updated events", () => {
    const parsed = parseHoldedWebhookEvent({
      event: "stock.updated",
      product: { id: "abc", name: "Vermut", stock: 12 },
    });
    expect(parsed.event).toBe("stock.updated");
    expect(parsed.product?.id).toBe("abc");
    expect(parsed.product?.stock).toBe(12);
  });

  it("detects product.deleted from action field", () => {
    const parsed = parseHoldedWebhookEvent({
      action: "product.removed",
      data: { id: "del-1", name: "Old SKU" },
    });
    expect(parsed.event).toBe("product.deleted");
  });
});

describe("findBarProfileForHoldedWebhook", () => {
  it("returns null when bar token is missing", async () => {
    await expect(findBarProfileForHoldedWebhook(undefined)).resolves.toBeNull();
    await expect(findBarProfileForHoldedWebhook("")).resolves.toBeNull();
    await expect(findBarProfileForHoldedWebhook("   ")).resolves.toBeNull();
  });
});

describe("checkRateLimit", () => {
  it("blocks requests after the configured limit", () => {
    const key = `test:${Date.now()}`;
    const options = { max: 2, windowMs: 60_000 };

    expect(checkRateLimit(key, options).allowed).toBe(true);
    expect(checkRateLimit(key, options).allowed).toBe(true);
    expect(checkRateLimit(key, options).allowed).toBe(false);
  });
});
