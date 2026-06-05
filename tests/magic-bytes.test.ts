import { describe, expect, it } from "vitest";
import {
  assertAllowedUserImage,
  detectImageMime,
  extensionForDetectedMime,
} from "@/lib/storage/magic-bytes";

describe("detectImageMime", () => {
  it("detects JPEG magic bytes", () => {
    const buf = Buffer.alloc(16);
    buf[0] = 0xff;
    buf[1] = 0xd8;
    buf[2] = 0xff;
    expect(detectImageMime(buf)).toBe("image/jpeg");
  });

  it("detects PNG magic bytes", () => {
    const buf = Buffer.alloc(16);
    buf[0] = 0x89;
    buf[1] = 0x50;
    buf[2] = 0x4e;
    buf[3] = 0x47;
    expect(detectImageMime(buf)).toBe("image/png");
  });

  it("rejects SVG disguised as JPEG", () => {
    const buf = Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>");
    expect(() => assertAllowedUserImage(buf, "image/jpeg")).toThrow(/no es una imagen válida/);
  });
});

describe("extensionForDetectedMime", () => {
  it("maps mime to extension", () => {
    expect(extensionForDetectedMime("image/png")).toBe("png");
  });
});
