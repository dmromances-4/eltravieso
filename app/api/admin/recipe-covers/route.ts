import { NextResponse } from "next/server";
import { adminApiErrorResponse, requireAdminUser } from "@/lib/auth/admin-api";
import { applyStockCoverFromUrl } from "@/lib/recipes/apply-stock-cover";
import { loadCocktails } from "@/lib/recipes/cocktails-io";

export async function POST(request: Request) {
  try {
    await requireAdminUser();
    const body = (await request.json()) as {
      slug?: string;
      url?: string;
      attribution?: string;
    };

    if (!body.slug?.trim() || !body.url?.trim()) {
      return NextResponse.json({ message: "slug y url son obligatorios." }, { status: 400 });
    }

    const recipes = loadCocktails();
    const recipe = recipes.find((r) => r.slug === body.slug.trim());
    const title = recipe?.title ?? body.slug.trim();

    const result = await applyStockCoverFromUrl(
      body.slug.trim(),
      title,
      body.url.trim(),
      body.attribution?.trim(),
    );

    return NextResponse.json(result);
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
