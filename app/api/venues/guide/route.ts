import { NextResponse } from "next/server";
import { listEditorialMapVenues } from "@/lib/venues/catalog";

export async function GET() {
  try {
    const venues = await listEditorialMapVenues();
    return NextResponse.json({ venues });
  } catch (error) {
    console.error("[VENUES_GUIDE_GET_ERROR]:", error);
    return NextResponse.json({ message: "Error al cargar destacados." }, { status: 500 });
  }
}
