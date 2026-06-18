import prisma from '@/lib/prisma'
import { Link } from '@/i18n/navigation'

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const productsCount = await prisma.product.count()
  const usersCount = await prisma.user.count()
  const blogPostsCount = await prisma.blogPost.count()
  const wholesaleOrdersCount = await prisma.wholesaleOrder.count()
  const productionBatchesCount = await prisma.productionBatch.count()
  const pendingListingsCount = await prisma.listing.count({ where: { status: 'PENDING' } })

  return (
    <div className="space-y-12">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold tracking-tight text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Resumen general de tu tienda y contenido.</p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {/* Products Stat */}
        <div className="rounded-[2rem] border border-white/10 bg-[#121212] p-8 shadow-neon relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(249,209,66,0.1),_transparent_50%)] opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative z-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Productos</h2>
            <p className="text-5xl font-display font-bold text-white mb-6">{productsCount}</p>
            <Link href="/admin/products" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-electric-yellow transition-colors hover:text-white">
              Gestionar →
            </Link>
          </div>
        </div>

        {/* Users Stat */}
        <div className="rounded-[2rem] border border-white/10 bg-[#121212] p-8 shadow-[0_0_40px_rgba(43,135,185,0.1)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(43,135,185,0.1),_transparent_50%)] opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative z-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Usuarios Registrados</h2>
            <p className="text-5xl font-display font-bold text-white mb-6">{usersCount}</p>
          </div>
        </div>

        {/* Blog Stat */}
        <div className="rounded-[2rem] border border-white/10 bg-[#121212] p-8 shadow-[0_0_40px_rgba(239,68,68,0.1)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(239,68,68,0.1),_transparent_50%)] opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative z-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Blog Posts</h2>
            <p className="text-5xl font-display font-bold text-white mb-6">{blogPostsCount}</p>
            <Link href="/admin/posts" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-red-500 transition-colors hover:text-white">
              Editar Blog →
            </Link>
          </div>
        </div>

        {/* Wholesale Orders Stat */}
        <div className="rounded-[2rem] border border-white/10 bg-[#121212] p-8 shadow-[0_0_40px_rgba(43,135,185,0.1)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(43,135,185,0.1),_transparent_50%)] opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative z-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Pedidos Mayoristas</h2>
            <p className="text-5xl font-display font-bold text-white mb-6">{wholesaleOrdersCount}</p>
            <Link href="/admin/wholesale" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-electric-blue transition-colors hover:text-white">
              Ver pedidos →
            </Link>
          </div>
        </div>

        {/* Production Batches Stat */}
        <div className="rounded-[2rem] border border-white/10 bg-[#121212] p-8 shadow-[0_0_40px_rgba(249,209,66,0.1)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(249,209,66,0.1),_transparent_50%)] opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative z-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Lotes de Producción</h2>
            <p className="text-5xl font-display font-bold text-white mb-6">{productionBatchesCount}</p>
            <Link href="/admin/production" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-electric-yellow transition-colors hover:text-white">
              Revisar lotes →
            </Link>
          </div>
        </div>
        {/* Marketplace Stat */}
        <div className="rounded-[2rem] border border-white/10 bg-[#121212] p-8 shadow-[0_0_40px_rgba(249,209,66,0.1)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(249,209,66,0.1),_transparent_50%)] opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative z-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Marketplace · Pendientes</h2>
            <p className="text-5xl font-display font-bold text-white mb-6">{pendingListingsCount}</p>
            <Link href="/admin/marketplace" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-electric-yellow transition-colors hover:text-white">
              Revisar artículos →
            </Link>
          </div>
        </div>
      </div>
      
      <div className="rounded-[2rem] border border-white/10 bg-[#121212] p-8 mt-12">
        <h2 className="text-2xl font-display font-bold text-white mb-6">Acciones Rápidas</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/admin/marketplace" className="rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black transition-all hover:brightness-110">
            Revisar Marketplace
          </Link>
          <Link href="/admin/posts" className="rounded-full border border-white/20 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:border-white/40">
            + Nueva Entrada Blog
          </Link>
          <Link href="/admin/wholesale" className="rounded-full border border-white/20 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:border-white/40">
            Pedidos mayoristas
          </Link>
        </div>
      </div>
    </div>
  );
}
