import { NextResponse } from "next/server";
import { logServerError } from '@/lib/security/safe-error';
import { listAffiliateMapVenues } from "@/lib/venues/catalog";

export async function GET() {
  try {
    const bars = await listAffiliateMapVenues();
    return NextResponse.json({ bars });
  } catch (error) {
    logServerError('bars', error);
    return NextResponse.json({ message: "Error al cargar locales." }, { status: 500 });
  }
}
