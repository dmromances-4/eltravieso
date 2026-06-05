import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function AccountOverviewPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const recipesCount = await prisma.recipe.count({ where: { authorId: user.id } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Hola, {user.name}</h1>
        <p className="mt-2 text-slate-400">Gestiona tu perfil, seguridad y recetas creadas con la Barra IA.</p>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Tu perfil</p>
            <p className="mt-2 text-white">{user.email}</p>
            {user.birthDate ? (
              <p className="mt-1 text-sm text-slate-400">
                Cumpleaños:{" "}
                {new Date(user.birthDate).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            ) : (
              <p className="mt-1 text-sm text-amber-400/90">Añade tu fecha de cumpleaños en configuración</p>
            )}
            {user.address ? (
              <p className="mt-1 text-sm text-slate-500">
                {[user.address, user.postalCode, user.city, user.country].filter(Boolean).join(", ")}
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Sin dirección de envío guardada</p>
            )}
          </div>
          <Link
            href="/cuenta/configuracion"
            className="inline-flex shrink-0 justify-center rounded-full border border-electric-yellow/30 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-electric-yellow hover:bg-electric-yellow/10"
          >
            Completar perfil
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Recetas creadas</p>
          <p className="mt-2 text-4xl font-display font-bold text-electric-yellow">{recipesCount}</p>
          <Link href="/cuenta/recetas" className="mt-4 inline-flex text-sm font-semibold text-electric-yellow hover:text-white">
            Ver mis recetas →
          </Link>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Seguridad</p>
          <p className="mt-2 text-lg font-semibold text-white">
            2FA {user.isTwoFactorEnabled ? "activado" : "desactivado"}
          </p>
          <Link href="/cuenta/seguridad" className="mt-4 inline-flex text-sm font-semibold text-electric-yellow hover:text-white">
            Gestionar seguridad →
          </Link>
        </div>
      </div>

      <div className="rounded-[2rem] border border-electric-yellow/20 bg-electric-yellow/5 p-6">
        <h2 className="text-lg font-bold text-white">Accesos rápidos</h2>
        <ul className="mt-4 space-y-3 text-sm">
          <li>
            <Link href="/pro/tech-generator?tab=agent" className="text-electric-yellow hover:text-white">
              Crear nueva receta con IA →
            </Link>
          </li>
          <li>
            <Link href="/cuenta/configuracion" className="text-slate-300 hover:text-white">
              Editar perfil →
            </Link>
          </li>
          <li>
            <Link href="/recetas" className="text-slate-300 hover:text-white">
              Explorar recetario público →
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
