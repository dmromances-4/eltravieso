import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartValidationError, validateCartLines } from "@/lib/checkout/validate-cart";

const { findManyMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    productVariant: {
      findMany: findManyMock,
    },
  },
}));

vi.mock("@/lib/holded/api", () => ({
  fetchHoldedStock: vi.fn().mockResolvedValue({ data: [{ availableQuantity: 100 }] }),
}));

function variantFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "var-1",
    sku: "SKU-1",
    priceCents: 1299,
    currency: "eur",
    stock: 10,
    isActive: true,
    channel: "B2C",
    format: "750ml",
    product: {
      id: "prod-1",
      title: "Vermut Rojo",
      description: "Desc",
      imageUrl: null,
      isActive: true,
      channel: "B2C",
    },
    ...overrides,
  };
}

describe("validateCartLines", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    delete process.env.HOLDED_API_KEY;
  });

  it("rejects empty cart", async () => {
    await expect(validateCartLines([])).rejects.toThrow(CartValidationError);
  });

  it("uses DB price and ignores client manipulation", async () => {
    findManyMock.mockResolvedValue([variantFixture({ priceCents: 2499 })]);

    const items = await validateCartLines([{ id: "var-1", quantity: 2 }]);

    expect(items).toHaveLength(1);
    expect(items[0].amount).toBe(2499);
    expect(items[0].quantity).toBe(2);
    expect(items[0].name).toBe("Vermut Rojo");
  });

  it("rejects inactive variants", async () => {
    findManyMock.mockResolvedValue([variantFixture({ isActive: false })]);

    await expect(validateCartLines([{ id: "var-1", quantity: 1 }])).rejects.toMatchObject({
      message: expect.stringContaining("no está disponible"),
    });
  });

  it("rejects insufficient stock", async () => {
    findManyMock.mockResolvedValue([variantFixture({ stock: 1 })]);

    await expect(validateCartLines([{ id: "var-1", quantity: 3 }])).rejects.toMatchObject({
      message: expect.stringContaining("Stock insuficiente"),
    });
  });

  it("rejects unknown variant ids", async () => {
    findManyMock.mockResolvedValue([]);

    await expect(validateCartLines([{ id: "missing", quantity: 1 }])).rejects.toMatchObject({
      message: expect.stringContaining("no existen"),
    });
  });
});
