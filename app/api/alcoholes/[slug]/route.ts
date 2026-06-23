import { getAlcoholBySlug } from "@/lib/alcohol/catalog";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRequestLocaleFromHeaders } from "@/lib/i18n/request-locale";

type RouteContext = { params: { slug: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const locale = getRequestLocaleFromHeaders(request);
  const spirit = getAlcoholBySlug(params.slug, locale);
  if (!spirit) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(spirit);
}
