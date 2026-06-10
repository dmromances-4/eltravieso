import { NextResponse } from "next/server";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";
import { searchTmdb } from "@/lib/media/tmdb";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const q = new URL(request.url).searchParams.get("q")?.trim();
    if (!q) return NextResponse.json({ results: [] });
    const results = await searchTmdb(q);
    return NextResponse.json({ results });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
