import { NextResponse } from "next/server";
import { adminApiErrorResponse, requireAdminUser } from "@/lib/auth/admin-api";
import { loadCocktails } from "@/lib/recipes/cocktails-io";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
  } catch (error) {
    return adminApiErrorResponse(error);
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q")?.trim().toLowerCase();

  const all = loadCocktails();
  const stats = {
    total: all.length,
    pending: all.filter((r) => (r.reviewStatus ?? "pending") === "pending").length,
    ok: all.filter((r) => r.reviewStatus === "ok").length,
    fixed: all.filter((r) => r.reviewStatus === "fixed").length,
    manual: all.filter((r) => r.reviewStatus === "manual").length,
  };

  let recipes = all;

  if (status && status !== "all") {
    recipes = recipes.filter((r) => (r.reviewStatus ?? "pending") === status);
  }

  if (q) {
    recipes = recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.slug.includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }

  return NextResponse.json({
    stats,
    recipes: recipes.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      reviewStatus: r.reviewStatus ?? "pending",
      sourceUrl: r.sourceUrl,
      diffordsId: r.diffordsId,
      reviewedAt: r.reviewedAt,
    })),
  });
}
