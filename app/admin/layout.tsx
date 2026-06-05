import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import LogoutButton from "@/components/LogoutButton";
import { adminAccessRedirect, evaluateAdminAccess } from "@/lib/auth/admin-access";
import { isAdmin2faRequired } from "@/lib/auth/admin-2fa-policy";

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const access = await evaluateAdminAccess(session);

  if (!access.allowed) {
    redirect(adminAccessRedirect(access.reason));
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col md:flex-row pt-20">
      <aside className="w-full md:w-64 bg-[#121212] border-r border-white/10 flex flex-col shrink-0">
        <div className="p-6">
          <Link
            href="/admin"
            className="text-xl font-display font-bold tracking-tight text-white hover:text-electric-yellow transition-colors"
          >
            El Travieso <span className="text-electric-yellow">Admin</span>
          </Link>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/90">
            Acceso protegido{isAdmin2faRequired() ? " · 2FA" : ""}
          </p>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            Productos
          </Link>
          <Link
            href="/admin/marketplace"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            Marketplace
          </Link>
          <Link
            href="/admin/wholesale"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            Mayorista
          </Link>
          <Link
            href="/admin/production"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            Producción
          </Link>
          <Link
            href="/admin/recipes"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            Recetas
          </Link>
          <Link
            href="/admin/recetas-auditoria"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            Auditoría Difford&apos;s
          </Link>
          <Link
            href="/admin/posts"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/admin/campaigns"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            Campañas
          </Link>
          <Link
            href="/admin/vip-drops"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            Drops VIP
          </Link>
          <Link
            href="/admin/delivery"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            Reparto
          </Link>
          <Link
            href="/admin/tax-registry"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            Fiscal
          </Link>
          <Link
            href="/admin/forum"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            Foro
          </Link>
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="mb-4 px-4">
            <p className="text-sm font-medium text-white">{session?.user?.name}</p>
            <p className="text-xs text-slate-500">{session?.user?.email}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-[#0A0A0A] text-white">{children}</main>
    </div>
  );
}
