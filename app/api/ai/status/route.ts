import { NextResponse } from "next/server";
import { getAiStatus } from "@/lib/ai/availability";

export async function GET() {
  const status = getAiStatus();
  return NextResponse.json(status, { status: status.available ? 200 : 503 });
}
