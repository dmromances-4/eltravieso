import { NextResponse } from "next/server";
import { listAffiliateMapVenues } from "@/lib/venues/catalog";

export async function GET() {
  try {
    const bars = await listAffiliateMapVenues();
    return NextResponse.json({ bars });
  } catch (error) {
    console.error("[BARS_GET_ERROR]:", error);
    return NextResponse.json({ message: "Error al cargar locales." }, { status: 500 });
  }
}
