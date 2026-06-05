import { describe, expect, it } from "vitest";
import { isMaskedSecret, maskSecret, parseSecretUpdate } from "@/lib/security/redact";

describe("redact", () => {
  it("masks secrets leaving tail visible", () => {
    expect(maskSecret("sk_live_abcdefghijklmnop")).toBe("********mnop");
  });

  it("detects masked placeholders", () => {
    expect(isMaskedSecret("********")).toBe(true);
    expect(isMaskedSecret("********abcd")).toBe(true);
    expect(isMaskedSecret("real-secret")).toBe(false);
  });

  it("ignores empty or masked updates", () => {
    expect(parseSecretUpdate("")).toBeUndefined();
    expect(parseSecretUpdate("********abcd")).toBeUndefined();
    expect(parseSecretUpdate("new-token-value")).toBe("new-token-value");
  });
});
