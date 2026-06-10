import { NextResponse } from "next/server";
import { syncAllPodcastFeeds } from "@/lib/media/sync-podcast";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ message: "CRON_SECRET no configurado." }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const results = await syncAllPodcastFeeds();
  return NextResponse.json({ synced: results.length, results });
}
