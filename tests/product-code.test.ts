import { describe, expect, it } from "vitest";
import {
  formatProductCode,
  parseProductCodeSequence,
  PRODUCT_CODE_PATTERN,
} from "@/lib/products/product-ids";

describe("product ids", () => {
  it("formats ET-PROD codes with 5 digits", () => {
    expect(formatProductCode(1)).toBe("ET-PROD-00001");
    expect(formatProductCode(42)).toBe("ET-PROD-00042");
  });

  it("parses sequence from code", () => {
    expect(parseProductCodeSequence("ET-PROD-00099")).toBe(99);
    expect(parseProductCodeSequence("invalid")).toBe(0);
  });

  it("validates pattern", () => {
    expect(PRODUCT_CODE_PATTERN.test("ET-PROD-00001")).toBe(true);
    expect(PRODUCT_CODE_PATTERN.test("ET-LOC-00001")).toBe(false);
  });
});
