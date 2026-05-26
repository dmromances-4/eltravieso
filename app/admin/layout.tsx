import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import React from "react"
import LogoutButton from "@/components/LogoutButton"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col md:flex-row pt-20">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#121212] border-r border-white/10 flex flex-col shrink-0">
        <div className="p-6">
          <Link href="/admin" className="text-xl font-display font-bold tracking-tight text-white hover:text-electric-yellow transition-colors">
            El Travieso <span className="text-electric-yellow">Admin</span>
          </Link>
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
            href="/admin/orders"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            Pedidos
          </Link>
          <Link
            href="/admin/blog"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            Blog
          </Link>
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="mb-4 px-4">
            <p className="text-sm font-medium text-white">{session.user.name}</p>
            <p className="text-xs text-slate-500">{session.user.email}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-[#0A0A0A] text-white">
        {children}
      </main>
    </div>
  )
}
