"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const links = [
  { href: "/cuenta", label: "Resumen", exact: true },
  { href: "/cuenta/configuracion", label: "Perfil" },
  { href: "/cuenta/seguridad", label: "Seguridad" },
  { href: "/cuenta/recetas", label: "Mis recetas" },
];

export default function AccountSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-6 lg:sticky lg:top-28">
      <div className="mb-6 border-b border-white/10 pb-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-electric-yellow/30 bg-[#0f0f0f]">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "Usuario"}
                fill
                className="object-cover"
                sizes="56px"
                unoptimized
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-bold text-electric-yellow">
                {(session?.user?.name || session?.user?.email || "U").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-electric-yellow">Mi cuenta</p>
            <p className="mt-1 truncate font-display text-lg font-bold text-white">{session?.user?.name || "Usuario"}</p>
          </div>
        </div>
        <p className="text-sm text-slate-400 truncate">{session?.user?.email}</p>
        {session?.user?.role === "ADMIN" ? (
          <Link
            href="/admin"
            className="mt-3 inline-flex text-xs font-bold uppercase tracking-[0.2em] text-electric-blue hover:text-white"
          >
            Panel admin →
          </Link>
        ) : null}
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-electric-yellow/10 text-electric-yellow"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-6 w-full rounded-full border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400 transition hover:border-red-500/40 hover:text-red-400"
      >
        Cerrar sesión
      </button>
    </aside>
  );
}
