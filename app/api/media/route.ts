import { NextResponse } from "next/server";
import { listPublishedMedia } from "@/lib/media/catalog";
import type { MediaKind } from "@prisma/client";

const VALID_KINDS: MediaKind[] = ["FILM", "SERIES", "PODCAST_SHOW", "EVENT_VIDEO"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kindParam = searchParams.get("kind");
  const q = searchParams.get("q") ?? undefined;
  const tag = searchParams.get("tag") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "48");

  const kind =
    kindParam && VALID_KINDS.includes(kindParam as MediaKind)
      ? (kindParam as MediaKind)
      : undefined;

  const items = await listPublishedMedia({ kind, q, tag, limit: Number.isFinite(limit) ? limit : 48 });
  return NextResponse.json({ items });
}
