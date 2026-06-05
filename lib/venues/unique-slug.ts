import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils/slug";

export async function generateUniqueBarSlug(businessName: string, excludeId?: string): Promise<string> {
  const base = slugify(businessName) || "local";
  let candidate = base;
  let n = 1;

  while (true) {
    const existing = await prisma.barProfile.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    const guide = await prisma.venueGuideEntry.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing && !guide) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

export function slugFromDetailPath(detailPath: string, category: "BARS" | "RESTAURANTS"): string {
  const file = detailPath.split("/").pop()?.replace(/\.html$/i, "") ?? "venue";
  const base = slugify(file) || "venue";
  return category === "BARS" ? base : `${base}-restaurant`;
}

export function normalizeVenueKey(name: string, city: string): string {
  return `${slugify(name)}::${slugify(city)}`;
}
