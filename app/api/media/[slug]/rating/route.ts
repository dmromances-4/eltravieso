import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getPublishedMediaBySlug } from "@/lib/media/catalog";
import { upsertMediaRating } from "@/lib/media/ratings";
import { validateRatingScore } from "@/lib/media/validate";

type RouteParams = { params: { slug: string } };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireCurrentUser();
    const item = await getPublishedMediaBySlug(params.slug);
    if (!item) return NextResponse.json({ message: "No encontrado." }, { status: 404 });

    const body = await request.json();
    const score = Number(body.score);
    const scoreError = validateRatingScore(score);
    if (scoreError) return NextResponse.json({ message: scoreError }, { status: 400 });
    const result = await upsertMediaRating(item.id, user.id, score);
    return NextResponse.json({ rating: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    const status = message === "UNAUTHORIZED" ? 401 : message.includes("puntuación") ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}
