import { NextResponse } from "next/server";
import { getPublishedMediaBySlug } from "@/lib/media/catalog";

type RouteParams = { params: { slug: string } };

export async function GET(_request: Request, { params }: RouteParams) {
  const item = await getPublishedMediaBySlug(params.slug);
  if (!item) {
    return NextResponse.json({ message: "Contenido no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ item });
}
