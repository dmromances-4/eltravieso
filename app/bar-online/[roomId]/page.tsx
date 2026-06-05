import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canJoinBarOnlineRoom } from "@/lib/realtime/room-access";
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

  const canJoin = await canJoinBarOnlineRoom(session.user.id, params.roomId);
  if (!canJoin) {
    return (
      <main className="min-h-screen bg-night px-6 pb-24 pt-32 text-white sm:px-8">
        <div className="mx-auto max-w-lg space-y-6 rounded-[2rem] border border-electric-red/30 bg-electric-red/10 p-8">
          <h1 className="text-2xl font-display font-bold">Acceso restringido</h1>
          <p className="text-slate-300">
            {room.isPrivate
              ? "Esta sala privada requiere membresía Club VIP o invitación del anfitrión."
              : "La sala está llena o no tienes permiso para entrar."}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/cuenta/membresia"
              className="rounded-full bg-electric-red px-6 py-3 text-xs font-bold uppercase tracking-widest text-white"
            >
              Ver membresía VIP
            </Link>
            <Link
              href="/bar-online"
              className="rounded-full border border-white/20 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:border-electric-yellow"
            >
              Volver al lobby
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
