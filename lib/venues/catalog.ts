import prisma from "@/lib/prisma";
import type { BarProfile, VenueGuideEntry } from "@prisma/client";
import type { MapVenueDTO, VenuePublicDTO } from "@/lib/venues/types";

const barSelect = {
  id: true,
  slug: true,
  businessName: true,
  city: true,
  country: true,
  address: true,
  venueType: true,
  photoUrl: true,
  history: true,
  verdict: true,
  foundationYear: true,
  signatureDrink: true,
  dressCode: true,
  vibeTags: true,
  phone: true,
  email: true,
  latitude: true,
  longitude: true,
  reservationProvider: true,
  reservationUrl: true,
  coverManagerUrl: true,
  theForkUrl: true,
  guideEntry: {
    select: {
      worlds50bestRank: true,
      worlds50bestCategory: true,
      sourceUrl: true,
      chefName: true,
      externalWebsite: true,
    },
  },
} as const;

const guideSelect = {
  id: true,
  slug: true,
  name: true,
  city: true,
  country: true,
  address: true,
  venueType: true,
  photoUrl: true,
  history: true,
  verdict: true,
  chefName: true,
  latitude: true,
  longitude: true,
  worlds50bestRank: true,
  worlds50bestCategory: true,
  sourceUrl: true,
  externalWebsite: true,
} as const;

export function barToPublicDTO(
  bar: BarProfile & {
    guideEntry?: {
      worlds50bestRank: number;
      worlds50bestCategory: VenueGuideEntry["worlds50bestCategory"];
      sourceUrl: string;
      chefName: string | null;
      externalWebsite: string | null;
    } | null;
  },
): VenuePublicDTO | null {
  if (!bar.slug) return null;

  return {
    id: bar.id,
    slug: bar.slug,
    name: bar.businessName,
    city: bar.city,
    country: bar.country,
    address: bar.address,
    venueType: bar.venueType ?? "bar",
    photoUrl: bar.photoUrl,
    history: bar.history,
    verdict: bar.verdict,
    foundationYear: bar.foundationYear,
    signatureDrink: bar.signatureDrink,
    dressCode: bar.dressCode,
    vibeTags: bar.vibeTags ?? [],
    phone: bar.phone,
    email: bar.email,
    latitude: bar.latitude,
    longitude: bar.longitude,
    source: "affiliate",
    worlds50bestRank: bar.guideEntry?.worlds50bestRank ?? null,
    worlds50bestCategory: bar.guideEntry?.worlds50bestCategory ?? null,
    sourceUrl: bar.guideEntry?.sourceUrl ?? null,
    externalWebsite: bar.guideEntry?.externalWebsite ?? null,
    chefName: bar.guideEntry?.chefName ?? null,
    reservationProvider: bar.reservationProvider,
    reservationUrl: bar.reservationUrl,
    coverManagerUrl: bar.coverManagerUrl,
    theForkUrl: bar.theForkUrl,
  };
}

export function guideToPublicDTO(entry: VenueGuideEntry): VenuePublicDTO {
  return {
    id: entry.id,
    slug: entry.slug,
    name: entry.name,
    city: entry.city,
    country: entry.country,
    address: entry.address,
    venueType: entry.venueType,
    photoUrl: entry.photoUrl,
    history: entry.history,
    verdict: entry.verdict,
    foundationYear: null,
    signatureDrink: null,
    dressCode: null,
    vibeTags: [],
    phone: null,
    email: null,
    latitude: entry.latitude,
    longitude: entry.longitude,
    source: "editorial",
    worlds50bestRank: entry.worlds50bestRank,
    worlds50bestCategory: entry.worlds50bestCategory,
    sourceUrl: entry.sourceUrl,
    externalWebsite: entry.externalWebsite,
    chefName: entry.chefName,
    reservationProvider: null,
    reservationUrl: null,
    coverManagerUrl: null,
    theForkUrl: null,
  };
}

export async function getPublicVenueBySlug(slug: string): Promise<VenuePublicDTO | null> {
  const bar = await prisma.barProfile.findFirst({
    where: { slug, isPublicOnMap: true },
    select: barSelect,
  });
  if (bar?.slug) {
    return barToPublicDTO(bar as BarProfile & { guideEntry: typeof bar.guideEntry });
  }

  const guide = await prisma.venueGuideEntry.findFirst({
    where: { slug, isPublished: true },
    select: guideSelect,
  });
  if (!guide) return null;

  return guideToPublicDTO(guide as VenueGuideEntry);
}

export async function listAffiliateVenueSlugs(): Promise<string[]> {
  const rows = await prisma.barProfile.findMany({
    where: { isPublicOnMap: true, slug: { not: null } },
    select: { slug: true },
  });
  return rows.map((r) => r.slug!).filter(Boolean);
}

export async function listEditorialVenueSlugs(): Promise<string[]> {
  const rows = await prisma.venueGuideEntry.findMany({
    where: { isPublished: true },
    select: { slug: true },
    orderBy: [{ worlds50bestCategory: "asc" }, { worlds50bestRank: "asc" }],
  });
  return rows.map((r) => r.slug);
}

export async function listAllPublicVenueSlugs(): Promise<string[]> {
  const [affiliate, editorial] = await Promise.all([
    listAffiliateVenueSlugs(),
    listEditorialVenueSlugs(),
  ]);
  const barSlugs = new Set(affiliate);
  return [...affiliate, ...editorial.filter((s) => !barSlugs.has(s))];
}

export async function listAffiliateMapVenues(): Promise<MapVenueDTO[]> {
  const bars = await prisma.barProfile.findMany({
    where: {
      isPublicOnMap: true,
      slug: { not: null },
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      slug: true,
      businessName: true,
      venueType: true,
      latitude: true,
      longitude: true,
      address: true,
      city: true,
      photoUrl: true,
      guideEntry: { select: { worlds50bestRank: true } },
    },
    orderBy: { businessName: "asc" },
  });

  return bars.map((bar) => ({
    id: bar.id,
    slug: bar.slug!,
    name: bar.businessName,
    venueType: bar.venueType ?? "bar",
    latitude: bar.latitude!,
    longitude: bar.longitude!,
    address: bar.address,
    city: bar.city,
    photoUrl: bar.photoUrl,
    profileUrl: `/locales/${bar.slug}`,
    layer: "affiliate" as const,
    worlds50bestRank: bar.guideEntry?.worlds50bestRank ?? null,
  }));
}

export async function listEditorialMapVenues(): Promise<MapVenueDTO[]> {
  const entries = await prisma.venueGuideEntry.findMany({
    where: {
      isPublished: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      venueType: true,
      latitude: true,
      longitude: true,
      address: true,
      city: true,
      photoUrl: true,
      worlds50bestRank: true,
    },
    orderBy: [{ worlds50bestCategory: "asc" }, { worlds50bestRank: "asc" }],
  });

  return entries.map((entry) => ({
    id: entry.id,
    slug: entry.slug,
    name: entry.name,
    venueType: entry.venueType,
    latitude: entry.latitude!,
    longitude: entry.longitude!,
    address: entry.address,
    city: entry.city,
    photoUrl: entry.photoUrl,
    profileUrl: `/locales/${entry.slug}`,
    layer: "editorial" as const,
    worlds50bestRank: entry.worlds50bestRank,
  }));
}

export async function listEditorialVenuesForIndex(limit = 50) {
  return prisma.venueGuideEntry.findMany({
    where: { isPublished: true },
    select: {
      slug: true,
      name: true,
      city: true,
      venueType: true,
      worlds50bestRank: true,
      worlds50bestCategory: true,
    },
    orderBy: [{ worlds50bestCategory: "asc" }, { worlds50bestRank: "asc" }],
    take: limit,
  });
}
