import { config } from "dotenv";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { ensureUtf8DatabaseUrl } from "@/lib/db-url";

// Scripts CLI importan prisma antes de cargar dotenv en el entrypoint.
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

// Windows: evita WIN1252 en scripts CLI y servidor Next.
if (!process.env.PGCLIENTENCODING) {
  process.env.PGCLIENTENCODING = "UTF8";
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const databaseUrl = ensureUtf8DatabaseUrl(process.env.DATABASE_URL);

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
    ...(databaseUrl
      ? { datasources: { db: { url: databaseUrl } } }
      : {}),
  });
  void client.$executeRawUnsafe(`SET client_encoding TO 'UTF8'`).catch(() => {});
  return client;
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
