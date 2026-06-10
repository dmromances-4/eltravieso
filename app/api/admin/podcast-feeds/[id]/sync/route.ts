import { NextResponse } from "next/server";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";
import { syncPodcastFeed } from "@/lib/media/sync-podcast";

type RouteParams = { params: { id: string } };

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    await requireAdminUser();
    const result = await syncPodcastFeed(params.id);
    return NextResponse.json(result);
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
