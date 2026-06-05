// Crea o actualiza un usuario ADMIN listo para entrar en /admin (2FA incluido).
// Ejecutar: npx tsx scripts/seed-admin.ts

import bcrypt from "bcryptjs";
import { generate } from "otplib";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL ?? "admin@eltravieso.bar";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "admin1234";
const ADMIN_NAME = process.env.ADMIN_SEED_NAME ?? "Admin El Travieso";

// Secreto fijo en local para poder reutilizar la misma entrada en la app de autenticación.
const DEV_2FA_SECRET = process.env.ADMIN_SEED_2FA_SECRET ?? "JBSWY3DPEHPK3PXP";

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: ADMIN_NAME,
      password: passwordHash,
      role: "ADMIN",
      ageVerifiedAt: new Date(),
      twoFactorSecret: DEV_2FA_SECRET,
      isTwoFactorEnabled: true,
    },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      password: passwordHash,
      role: "ADMIN",
      ageVerifiedAt: new Date(),
      twoFactorSecret: DEV_2FA_SECRET,
      isTwoFactorEnabled: true,
    },
  });

  const otp = await generate({ secret: DEV_2FA_SECRET, strategy: "totp" });

  console.log("\n✓ Usuario admin listo\n");
  console.log(`  Email:      ${ADMIN_EMAIL}`);
  console.log(`  Contraseña: ${ADMIN_PASSWORD}`);
  console.log(`  2FA:        activado`);
  console.log(`  Secreto:    ${DEV_2FA_SECRET}`);
  console.log(`  Código 2FA: ${otp} (válido ~30 s)\n`);
  console.log("  1. Abre http://localhost:3000/login");
  console.log("  2. Inicia sesión con email y contraseña");
  console.log("  3. Introduce el código 2FA (o el de tu app con el secreto de arriba)");
  console.log("  4. Entra en http://localhost:3000/admin\n");
  console.log(`  ID: ${user.id}\n`);
}

main()
  .catch((error) => {
    console.error("Error creando admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
