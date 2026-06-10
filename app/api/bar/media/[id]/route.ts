import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type RouteParams = { params: { id: string } };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });

  const item = await prisma.mediaItem.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ message: "No encontrado." }, { status: 404 });

  const isOwner = item.createdById === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  await prisma.mediaItem.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Eliminado." });
}
