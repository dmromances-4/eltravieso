import { NextResponse } from "next/server";
import { listPublishedLiveStreams } from "@/lib/media/catalog";

export async function GET() {
  const streams = await listPublishedLiveStreams();
  return NextResponse.json({ streams });
}
