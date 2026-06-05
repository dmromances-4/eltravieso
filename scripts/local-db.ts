// ─────────────────────────────────────────────────────────────────────────────
// PostgreSQL local sin Docker para desarrollo/demo (embedded-postgres).
// Arranca un Postgres real persistente en .localpg/ escuchando en :5433 y crea
// la base "vermut". Se queda en primer plano hasta Ctrl+C.
//   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/vermut"
// ─────────────────────────────────────────────────────────────────────────────

import fs from "fs";
import path from "path";
import EmbeddedPostgres from "embedded-postgres";

const DATA_DIR = path.resolve(process.cwd(), ".localpg");
const PORT = Number(process.env.LOCAL_PG_PORT ?? 5433);
const DB_NAME = process.env.LOCAL_PG_DB ?? "vermut";

async function main() {
  const alreadyInitialised = fs.existsSync(path.join(DATA_DIR, "PG_VERSION"));

  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: "postgres",
    password: "postgres",
    port: PORT,
    persistent: true,
  });

  if (!alreadyInitialised) {
    console.log("[local-db] Inicializando cluster en .localpg/ ...");
    await pg.initialise();
  }

  await pg.start();
  console.log(`[local-db] PostgreSQL escuchando en localhost:${PORT}`);

  try {
    await pg.createDatabase(DB_NAME);
    console.log(`[local-db] Base de datos "${DB_NAME}" creada.`);
  } catch {
    console.log(`[local-db] Base de datos "${DB_NAME}" ya existe (ok).`);
  }

  console.log(
    `[local-db] Listo. DATABASE_URL="postgresql://postgres:postgres@localhost:${PORT}/${DB_NAME}"`
  );
  console.log("[local-db] Pulsa Ctrl+C para detener.");

  const shutdown = async () => {
    console.log("\n[local-db] Deteniendo PostgreSQL...");
    try {
      await pg.stop();
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Mantener el proceso vivo.
  await new Promise<void>(() => {});
}

main().catch((error) => {
  console.error("[local-db] Error:", error);
  process.exit(1);
});
