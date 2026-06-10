import { NextResponse } from "next/server";
import { getDevHealthReport } from "@/lib/dev/health";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const report = await getDevHealthReport();
  return NextResponse.json(report);
}
