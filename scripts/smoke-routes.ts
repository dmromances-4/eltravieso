/**
 * Smoke test de rutas clave. Ejecutar con el dev server activo:
 *   npm run dev
 *   npx tsx scripts/smoke-routes.ts
 */

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

type Check = {
  name: string;
  path: string;
  method?: "GET" | "POST";
  expectStatus?: number | number[];
};

const checks: Check[] = [
  { name: "Home ES", path: "/", expectStatus: 200 },
  { name: "Home EN", path: "/en", expectStatus: 200 },
  { name: "Recetas ES", path: "/recetas", expectStatus: 200 },
  { name: "Recetas EN", path: "/en/recetas", expectStatus: 200 },
  { name: "Shop EN", path: "/en/shop", expectStatus: 200 },
  { name: "Alcoholes", path: "/alcoholes", expectStatus: 200 },
  { name: "Shop", path: "/shop", expectStatus: 200 },
  { name: "Comunidad", path: "/comunidad", expectStatus: 200 },
  { name: "Blog", path: "/blog", expectStatus: 200 },
  { name: "Mapa", path: "/mapa", expectStatus: 200 },
  { name: "Mapa EN", path: "/en/mapa", expectStatus: 200 },
  { name: "Mapa deep link", path: "/mapa?slug=sips", expectStatus: 200 },
  { name: "Biblioteca", path: "/biblioteca", expectStatus: 200 },
  { name: "Pantalla", path: "/pantalla", expectStatus: 200 },
  { name: "Bar Online", path: "/bar-online", expectStatus: 200 },
  { name: "Tech generator EN", path: "/en/pro/tech-generator", expectStatus: 200 },
  { name: "Login", path: "/login", expectStatus: 200 },
  { name: "Login EN", path: "/en/login", expectStatus: 200 },
  { name: "Legal EN", path: "/en/aviso-legal", expectStatus: 200 },
  { name: "Membresia (auth)", path: "/cuenta/membresia", expectStatus: [200, 302, 307] },
  { name: "Admin (auth)", path: "/admin", expectStatus: [302, 307] },
  { name: "AI status", path: "/api/ai/status", expectStatus: [200, 503] },
  { name: "Alcoholes API", path: "/api/alcoholes", expectStatus: 200 },
  { name: "Forum API", path: "/api/forum/topics", expectStatus: 200 },
  { name: "Holded sync (auth)", path: "/api/integrations/holded/sync", method: "POST", expectStatus: 401 },
  { name: "Holded webhook (no sig)", path: "/api/integrations/holded/webhook", method: "POST", expectStatus: [400, 401, 503] },
  { name: "Square sync (auth)", path: "/api/integrations/square/sync", method: "POST", expectStatus: 401 },
];

function statusOk(status: number, expected?: number | number[]) {
  if (!expected) return status < 500;
  return Array.isArray(expected) ? expected.includes(status) : status === expected;
}

async function run() {
  let failed = 0;

  for (const check of checks) {
    try {
      const res = await fetch(`${BASE_URL}${check.path}`, {
        method: check.method ?? "GET",
        redirect: "manual",
      });
      if (!statusOk(res.status, check.expectStatus)) {
        console.error(`FAIL ${check.name}: ${res.status} ${check.path}`);
        failed += 1;
      } else {
        console.log(`OK   ${check.name}: ${res.status}`);
      }
    } catch (error) {
      console.error(`FAIL ${check.name}: ${error instanceof Error ? error.message : "error"}`);
      failed += 1;
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed against ${BASE_URL}`);
    process.exit(1);
  }

  console.log(`\nAll ${checks.length} smoke checks passed.`);
}

run();
