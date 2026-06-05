import { describe, expect, it } from "vitest";
import { calculateOrderSplits, calculateSplitLine } from "@/lib/checkout/calculate-order-split";

describe("calculate-order-split", () => {
  it("assigns 100% to platform for PROPIO products", () => {
    const result = calculateSplitLine({
      orderItemId: "oi-1",
      productId: "p-1",
      partnerId: null,
      source: "PROPIO",
      commissionRateBps: 2000,
      grossCents: 1000,
    });

    expect(result.platformCents).toBe(1000);
    expect(result.partnerCents).toBe(0);
  });

  it("splits marketplace gross by commissionRateBps", () => {
    const result = calculateSplitLine({
      orderItemId: "oi-2",
      productId: "p-2",
      partnerId: "user-partner",
      source: "MARKETPLACE",
      commissionRateBps: 2000,
      grossCents: 1000,
    });

    expect(result.platformCents).toBe(200);
    expect(result.partnerCents).toBe(800);
  });

  it("handles multiple lines", () => {
    const splits = calculateOrderSplits([
      {
        orderItemId: "a",
        productId: "p1",
        partnerId: null,
        source: "PROPIO",
        commissionRateBps: 2000,
        grossCents: 500,
      },
      {
        orderItemId: "b",
        productId: "p2",
        partnerId: "seller",
        source: "MARKETPLACE",
        commissionRateBps: 2500,
        grossCents: 1000,
      },
    ]);

    expect(splits).toHaveLength(2);
    expect(splits[1].platformCents).toBe(250);
    expect(splits[1].partnerCents).toBe(750);
  });
});
