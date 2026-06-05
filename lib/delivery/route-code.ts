import prisma from "@/lib/prisma";

export async function generateRouteCode(cityHint?: string) {
  const year = new Date().getFullYear();
  const city = (cityHint ?? "GEN").slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "") || "GEN";
  const prefix = `RT-${year}-${city}`;

  const existing = await prisma.deliveryRoute.count({
    where: { routeCode: { startsWith: prefix } },
  });

  return `${prefix}-${String(existing + 1).padStart(3, "0")}`;
}
