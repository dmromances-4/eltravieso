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

    const slug = body.slug?.trim();
    const url = body.url?.trim();
    if (!slug || !url) {
      return NextResponse.json({ message: "slug y url son obligatorios." }, { status: 400 });
    }

    const slug = body.slug.trim();
    const url = body.url.trim();

    const recipes = loadCocktails();
    const recipe = recipes.find((r) => r.slug === slug);
    const title = recipe?.title ?? slug;

    const result = await applyStockCoverFromUrl(
      slug,
      title,
      url,
      body.attribution?.trim(),
    );

    return NextResponse.json(result);
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
