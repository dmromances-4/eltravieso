import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import BarOnlineRoom from "@/components/bar-online/BarOnlineRoom";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { roomId: string };
}): Promise<Metadata> {
  const session = await prisma.barOnlineSession.findUnique({
    where: { roomId: params.roomId },
    select: { title: true },
  });
  return {
    title: session ? `${session.title} | Bar Online` : "Sala no encontrada",
  };
}

export default async function BarOnlineRoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/bar-online/${params.roomId}`);
  }

  const room = await prisma.barOnlineSession.findUnique({
    where: { roomId: params.roomId },
  });

  if (!room || !room.isActive) {
    notFound();
  }

  // Register the visitor as a participant (idempotent).
  await prisma.barOnlineSession.update({
    where: { id: room.id },
    data: { participants: { connect: { id: session.user.id } } },
  });

  return (
    <main className="min-h-screen bg-night px-6 pb-24 pt-32 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <BarOnlineRoom
          roomId={room.roomId!}
          title={room.title}
          type={room.type}
          currentUserId={session.user.id}
        />
      </div>
    </main>
  );
}
