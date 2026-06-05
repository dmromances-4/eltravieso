import { describe, expect, it } from "vitest";

const BASE_URL = process.env.SMOKE_BASE_URL;

const publicRoutes = [
  "/",
  "/alcoholes",
  "/recetas",
  "/shop",
  "/comunidad",
  "/blog",
];

const publicApis = [
  { path: "/api/ai/status", ok: [200, 503] },
  { path: "/api/alcoholes", ok: [200] },
  { path: "/api/forum/topics", ok: [200] },
];

describe.skipIf(!BASE_URL)("E2E smoke (requires dev server)", () => {
  for (const path of publicRoutes) {
    it(`GET ${path} returns < 500`, async () => {
      const res = await fetch(`${BASE_URL}${path}`);
      expect(res.status).toBeLessThan(500);
    });
  }

  for (const api of publicApis) {
    it(`GET ${api.path} returns expected status`, async () => {
      const res = await fetch(`${BASE_URL}${api.path}`);
      expect(api.ok).toContain(res.status);
    });
  }

  it("integration sync routes require auth", async () => {
    for (const provider of ["holded", "square", "shopify"]) {
      const res = await fetch(`${BASE_URL}/api/integrations/${provider}/sync`, {
        method: "POST",
      });
      expect(res.status).toBe(401);
    }
  });
});
