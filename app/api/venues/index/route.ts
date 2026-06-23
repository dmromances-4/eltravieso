import { NextRequest, NextResponse } from "next/server";
import { logServerError } from "@/lib/security/safe-error";
import { listEditorialVenuesForIndex } from "@/lib/venues/catalog";
import { getRequestLocaleFromHeaders } from "@/lib/i18n/request-locale";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const locale = getRequestLocaleFromHeaders(request);
    const venues = await listEditorialVenuesForIndex(309, null, locale);
    return NextResponse.json({ venues });
  } catch (error) {
    logServerError("venues-index", error);
    return NextResponse.json({ message: "Error al cargar el índice." }, { status: 500 });
  }
}
