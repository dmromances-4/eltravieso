import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils/slug";

const VALID_CATEGORIES = [
  "VERMUT",
  "ALCOHOL",
  "COCTELERIA",
  "SIROPE",
  "SODA",
  "CONSERVA_LATERIO",
  "CRISTALERIA",
  "MATERIAL",
  "ROPA",
  "MERCH",
  "INGREDIENTE",
];

const VALID_FORMATS = ["UNIT", "BOTTLE_75CL", "BAG_IN_BOX_3L", "CASE_6", "CASE_12", "PALET"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const listings = await prisma.listing.findMany({
      where: { sellerId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ listings });
  } catch (error: any) {
    console.error("[LISTINGS_GET_ERROR]:", error);
    return NextResponse.json({ message: error.message || "Error al obtener tus artículos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const description = body.description ? String(body.description).trim() : null;
    const category = VALID_CATEGORIES.includes(body.category) ? body.category : "MATERIAL";
    const format = VALID_FORMATS.includes(body.format) ? body.format : "UNIT";
    const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
    const priceEuros = Number(body.priceEuros);

    if (!title || title.length < 3) {
      return NextResponse.json({ message: "El título es obligatorio (mín. 3 caracteres)." }, { status: 400 });
    }
    if (!Number.isFinite(priceEuros) || priceEuros <= 0) {
      return NextResponse.json({ message: "Introduce un precio válido en euros." }, { status: 400 });
    }

    const priceCents = Math.round(priceEuros * 100);
    // slug único por listing (con sufijo si ya existe).
    const base = slugify(title) || "articulo";
    let slug = base;
    let n = 1;
    while (await prisma.listing.findUnique({ where: { slug } })) {
      slug = `${base}-${n++}`;
    }

    const listing = await prisma.listing.create({
      data: {
        sellerId: session.user.id,
        title,
        slug,
        description,
        category: category as any,
        format: format as any,
        imageUrl,
        priceCents,
        status: "PENDING",
      },
    });

    return NextResponse.json({ message: "Artículo enviado a revisión.", listing }, { status: 201 });
  } catch (error: any) {
    console.error("[LISTINGS_POST_ERROR]:", error);
    return NextResponse.json({ message: error.message || "Error al crear el artículo." }, { status: 500 });
  }
}
