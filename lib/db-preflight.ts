import prisma from "@/lib/prisma";

export type DbPreflightResult =
  | { ok: true; serverEncoding: string }
  | { ok: false; reason: "unreachable" | "encoding"; message: string };

/** Comprueba conexión y encoding antes de scripts que escriben locales internacionales. */
export async function checkDbPreflight(): Promise<DbPreflightResult> {
  try {
    await prisma.$connect();
    const rows = await prisma.$queryRaw<{ server_encoding: string }[]>`SHOW server_encoding`;
    const serverEncoding = rows[0]?.server_encoding ?? "unknown";
    if (serverEncoding !== "UTF8") {
      return {
        ok: false,
        reason: "encoding",
        message:
          `PostgreSQL server_encoding=${serverEncoding}. En Windows con embedded Postgres (npm run db:local), ` +
          "borra la carpeta .localpg/ y reinicia, o usa Docker: docker compose up -d postgres " +
          "con DATABASE_URL en puerto 5432.",
      };
    }
    return { ok: true, serverEncoding };
  } catch {
    return {
      ok: false,
      reason: "unreachable",
      message:
        "No se puede conectar a PostgreSQL. Arranca la BD antes de continuar:\n" +
        "  • Docker: docker compose up -d postgres  →  DATABASE_URL puerto 5432\n" +
        "  • Embedded: npm run db:local (otra terminal)  →  DATABASE_URL puerto 5433",
    };
  }
}

export async function requireDbPreflight(scriptName: string): Promise<void> {
  const result = await checkDbPreflight();
  if (!result.ok) {
    console.error(`✗ ${scriptName}: ${result.message}`);
    process.exit(1);
  }
}
