import { describe, expect, it } from "vitest";
import { ensureUtf8DatabaseUrl, normalizeUnicodeNfc } from "@/lib/db-url";

describe("ensureUtf8DatabaseUrl", () => {
  it("appends client_encoding when missing", () => {
    expect(ensureUtf8DatabaseUrl("postgresql://localhost:5433/vermut")).toBe(
      "postgresql://localhost:5433/vermut?options=-c%20client_encoding%3DUTF8",
    );
  });

  it("does not duplicate client_encoding", () => {
    const url = "postgresql://localhost:5433/vermut?options=-c%20client_encoding%3DUTF8";
    expect(ensureUtf8DatabaseUrl(url)).toBe(url);
  });

  it("preserves existing query params", () => {
    expect(ensureUtf8DatabaseUrl("postgresql://localhost:5433/vermut?schema=public")).toBe(
      "postgresql://localhost:5433/vermut?schema=public&options=-c%20client_encoding%3DUTF8",
    );
  });

  it("normalizes NFD accents to NFC", () => {
    const nfd = "Factori\u0301a";
    expect(normalizeUnicodeNfc(nfd)).toBe("Factoría");
  });
});
