import { describe, expect, it } from "vitest";
import { geminiKeyFormatHint, readEnvKey } from "@/lib/recipes/cover-env";

describe("cover-env", () => {
  it("readEnvKey treats empty and quoted values as missing", () => {
    expect(readEnvKey("TEST_EMPTY")).toBeUndefined();
    process.env.TEST_EMPTY = "";
    expect(readEnvKey("TEST_EMPTY")).toBeUndefined();
    process.env.TEST_QUOTED = '" abc "';
    expect(readEnvKey("TEST_QUOTED")).toBe("abc");
    delete process.env.TEST_EMPTY;
    delete process.env.TEST_QUOTED;
  });

  it("geminiKeyFormatHint accepts Google-style keys", () => {
    expect(geminiKeyFormatHint("AIzaSyD" + "x".repeat(30))).toBeNull();
    expect(geminiKeyFormatHint("AQ." + "x".repeat(40))).toBeNull();
    expect(geminiKeyFormatHint("sk-short")).toMatch(/AIza|AQ\./);
  });
});
