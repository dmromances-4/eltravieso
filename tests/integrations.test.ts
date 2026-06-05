import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { isHoldedConfigured } from "../lib/integrations/holded-catalog";
import { resolveVariantByTpvIdentifier } from "../lib/integrations/resolve-variant";

const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();

vi.mock("../lib/prisma", () => ({
  default: {
    productVariant: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
    product: { findMany: (...args: unknown[]) => mockFindMany(...args) },
  },
}));

describe("Holded integration helpers", () => {
  const original = process.env.HOLDED_API_KEY;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.HOLDED_API_KEY;
    } else {
      process.env.HOLDED_API_KEY = original;
    }
  });

  it("detects server-level Holded API key", () => {
    process.env.HOLDED_API_KEY = "server-key";
    expect(isHoldedConfigured(null)).toBe(true);
    expect(isHoldedConfigured("")).toBe(true);
  });

  it("detects profile-level Holded API key", () => {
    delete process.env.HOLDED_API_KEY;
    expect(isHoldedConfigured("bar-key")).toBe(true);
    expect(isHoldedConfigured(null)).toBe(false);
  });
});

describe("resolveVariantByTpvIdentifier", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockFindMany.mockReset();
  });

  it("returns variant by direct SKU match", async () => {
    const variant = { id: "v1", sku: "SKU-1", productId: "p1" };
    mockFindUnique.mockResolvedValueOnce(variant);

    const result = await resolveVariantByTpvIdentifier("revo", "SKU-1");
    expect(result).toEqual(variant);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("falls back to Square metadata lookup when SKU misses", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockFindMany.mockResolvedValueOnce([
      { variants: [{ id: "v2", sku: "VAR-ID", productId: "p2" }] },
    ]);

    const result = await resolveVariantByTpvIdentifier("square", "VAR-ID");
    expect(result?.id).toBe("v2");
    expect(mockFindMany).toHaveBeenCalled();
  });
});
