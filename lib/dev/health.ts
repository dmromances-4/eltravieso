import prisma from "@/lib/prisma";

export type DevHealthReport = {
  database: "ok" | "error";
  migrations: "ok" | "pending" | "unknown";
  ws: "ok" | "unreachable" | "skipped";
  authUrls: "ok" | "warning";
  map: {
    venuesWithCoords: number;
    guideApi: "ok" | "error" | "skipped";
    barsApi: "ok" | "error" | "skipped";
  };
  warnings: string[];
  features: {
    pantallaTmdb: boolean;
    barOnline: boolean;
    aiAgent: boolean;
    supabaseUploads: boolean;
  };
};

function hasAiKey() {
  return Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.HUGGINGFACE_API_KEY ||
      process.env.AI_MOCK === "true",
  );
}

function authUrlWarning(): string | null {
  const auth = process.env.NEXTAUTH_URL ?? "";
  const app = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (auth.includes("127.0.0.1") || app.includes("127.0.0.1")) {
    return "Usa http://localhost:3000 en NEXTAUTH_URL y NEXT_PUBLIC_APP_URL (no 127.0.0.1).";
  }
  if (auth && app && auth.replace(/\/$/, "") !== app.replace(/\/$/, "")) {
    return "NEXTAUTH_URL y NEXT_PUBLIC_APP_URL deben coincidir.";
  }
  return null;
}

async function checkWs(): Promise<DevHealthReport["ws"]> {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (!wsUrl) return "skipped";
  try {
    const base = wsUrl.replace(/\/$/, "");
    const res = await fetch(`${base}/socket.io/?EIO=4&transport=polling`, {
      signal: AbortSignal.timeout(2500),
    });
    return res.ok ? "ok" : "unreachable";
  } catch {
    return "unreachable";
  }
}

async function checkMapHealth(): Promise<DevHealthReport["map"]> {
  let venuesWithCoords = 0;
  if (process.env.DATABASE_URL) {
    try {
      venuesWithCoords = await prisma.venueGuideEntry.count({
        where: {
          isPublished: true,
          latitude: { not: null },
          longitude: { not: null },
        },
      });
      venuesWithCoords += await prisma.barProfile.count({
        where: {
          isPublicOnMap: true,
          latitude: { not: null },
          longitude: { not: null },
        },
      });
    } catch {
      // database check handles this
    }
  }

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  let guideApi: DevHealthReport["map"]["guideApi"] = "skipped";
  let barsApi: DevHealthReport["map"]["barsApi"] = "skipped";

  try {
    const [guideRes, barsRes] = await Promise.all([
      fetch(`${baseUrl}/api/venues/guide`, { signal: AbortSignal.timeout(4000) }),
      fetch(`${baseUrl}/api/bars`, { signal: AbortSignal.timeout(4000) }),
    ]);
    guideApi = guideRes.ok ? "ok" : "error";
    barsApi = barsRes.ok ? "ok" : "error";
  } catch {
    guideApi = "error";
    barsApi = "error";
  }

  return { venuesWithCoords, guideApi, barsApi };
}

export async function getDevHealthReport(): Promise<DevHealthReport> {
  const warnings: string[] = [];
  let database: DevHealthReport["database"] = "error";
  let migrations: DevHealthReport["migrations"] = "unknown";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ok";
  } catch {
    warnings.push("DATABASE_URL no alcanzable. ¿Docker (5432) o npm run db:local (5433)?");
  }

  try {
    const { execSync } = await import("child_process");
    const out = execSync("npx prisma migrate status 2>&1", {
      encoding: "utf8",
      timeout: 8000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    migrations =
      out.includes("have not yet been applied") || out.includes("not up to date")
        ? "pending"
        : "ok";
    if (migrations === "pending") {
      warnings.push("Hay migraciones pendientes. Ejecuta: npx prisma migrate deploy");
    }
  } catch {
    migrations = "unknown";
  }

  const ws = await checkWs();
  if (ws === "unreachable") {
    warnings.push("Bar Online: arranca npm run dev:ws en otra terminal (puerto 3001).");
  }

  const authWarn = authUrlWarning();
  const authUrls: DevHealthReport["authUrls"] = authWarn ? "warning" : "ok";
  if (authWarn) warnings.push(authWarn);

  if (!process.env.TMDB_API_KEY) {
    warnings.push("TMDB_API_KEY ausente — import Pantalla desactivado.");
  }

  const map = await checkMapHealth();
  if (map.venuesWithCoords === 0) {
    warnings.push(
      "Mapa sin pins: ejecuta npm run seed:venues && npm run geocode:venues -- --only-missing",
    );
  }
  if (map.guideApi === "error" || map.barsApi === "error") {
    warnings.push("APIs del mapa no responden. ¿npm run dev en localhost:3000?");
  }

  return {
    database,
    migrations,
    ws,
    authUrls,
    map,
    warnings,
    features: {
      pantallaTmdb: Boolean(process.env.TMDB_API_KEY),
      barOnline: ws === "ok",
      aiAgent: hasAiKey(),
      supabaseUploads: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
  };
}

export function hasDevIssues(report: DevHealthReport) {
  return (
    report.database !== "ok" ||
    report.migrations === "pending" ||
    report.ws === "unreachable" ||
    report.authUrls === "warning"
  );
}
