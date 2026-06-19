import { NextRequest, NextResponse } from "next/server";
import { logServerError } from '@/lib/security/safe-error';
import type { VenueContinent } from "@prisma/client";
import { listEditorialMapVenues } from "@/lib/venues/catalog";

export const dynamic = "force-dynamic";

const VALID_CONTINENTS = new Set<string>([
  "GLOBAL",
  "EUROPE",
  "ASIA",
  "NORTH_AMERICA",
  "LATIN_AMERICA",
  "MIDDLE_EAST_AFRICA",
  "OCEANIA",
]);

export async function GET(request: NextRequest) {
  try {
    const continentParam = request.nextUrl.searchParams.get("continent");
    const continent =
      continentParam && VALID_CONTINENTS.has(continentParam)
        ? (continentParam as VenueContinent)
        : undefined;

    const venues = await listEditorialMapVenues(continent);
    return NextResponse.json({ venues });
  } catch (error) {
    logServerError('venues-guide', error);
    return NextResponse.json({ message: "Error al cargar destacados." }, { status: 500 });
  }
}
