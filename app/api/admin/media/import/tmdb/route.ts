import { NextResponse } from "next/server";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";
import { importTmdbMovie, importTmdbTvSeries } from "@/lib/media/import-tmdb";

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const tmdbId = Number(body.tmdbId);
    const type = String(body.type ?? "movie");
    const publish = body.publish === true;
    const seasons = Array.isArray(body.seasons) ? body.seasons.map(Number) : undefined;

    if (!Number.isFinite(tmdbId)) {
      return NextResponse.json({ message: "tmdbId inválido." }, { status: 400 });
    }

    if (type === "tv") {
      const result = await importTmdbTvSeries(tmdbId, admin.id, { seasons, publish });
      return NextResponse.json(result);
    }

    const item = await importTmdbMovie(tmdbId, admin.id, publish);
    return NextResponse.json({ item });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
