import prisma from "@/lib/prisma";
import { formatVenueCode, parseVenueCodeSequence } from "@/lib/venues/external-ids";

async function maxSequenceInUse(): Promise<number> {
  const [bars, guides] = await Promise.all([
    prisma.barProfile.findMany({
      where: { venueCode: { not: null } },
      select: { venueCode: true },
    }),
    prisma.venueGuideEntry.findMany({
      where: { venueCode: { not: null } },
      select: { venueCode: true },
    }),
  ]);

  let max = 0;
  for (const row of [...bars, ...guides]) {
    max = Math.max(max, parseVenueCodeSequence(row.venueCode));
  }
  return max;
}

export async function allocateVenueCode(): Promise<string> {
  const next = (await maxSequenceInUse()) + 1;
  return formatVenueCode(next);
}

export async function ensureUniqueVenueCode(exclude?: {
  barProfileId?: string;
  venueGuideEntryId?: string;
}): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = await allocateVenueCode();
    const [barConflict, guideConflict] = await Promise.all([
      prisma.barProfile.findFirst({
        where: {
          venueCode: code,
          ...(exclude?.barProfileId ? { NOT: { id: exclude.barProfileId } } : {}),
        },
        select: { id: true },
      }),
      prisma.venueGuideEntry.findFirst({
        where: {
          venueCode: code,
          ...(exclude?.venueGuideEntryId ? { NOT: { id: exclude.venueGuideEntryId } } : {}),
        },
        select: { id: true },
      }),
    ]);
    if (!barConflict && !guideConflict) return code;
  }
  throw new Error("No se pudo asignar un código de local único.");
}
