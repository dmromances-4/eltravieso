import Link from 'next/link'
import prisma from '@/lib/prisma'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | Vermut El Travieso',
  description: 'Artículos, recetas y la cultura más canalla del vermut.',
}

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    include: { author: true }
  })

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 text-white">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="mb-16 space-y-4">
          <p className="inline-flex rounded-full border border-electric-blue/20 bg-electric-blue/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-electric-blue">
            Cultura Canalla
          </p>
          <h1 className="text-5xl font-display font-bold tracking-tight text-white sm:text-6xl">
            Diario de un <span className="text-electric-yellow italic pr-2">Travieso</span>.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-400">
            Historias de barra, secretos de destilación y todo lo que no te cuentan sobre el vermut.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-[2.5rem] border border-white/10 bg-[#111111]/90 p-16 text-center shadow-neon backdrop-blur-xl">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="text-4xl">✍️</span>
            </div>
            <h2 className="text-2xl font-display text-white mb-2">El tintero está seco</h2>
            <p className="text-slate-400">Estamos preparando nuevas historias. Vuelve pronto.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#121212] transition-all duration-300 hover:-translate-y-2 hover:border-electric-blue/30 hover:shadow-[0_0_40px_rgba(0,163,224,0.15)] flex flex-col">
                <div className="p-8 flex flex-col flex-grow">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {new Date(post.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-electric-yellow">Leer →</span>
                  </div>
                  
                  <h2 className="text-2xl font-display font-bold text-white mb-4 group-hover:text-electric-blue transition-colors">
                    {post.title}
                  </h2>
                  
                  <p className="text-sm leading-relaxed text-slate-400 mb-8 line-clamp-3">
                    {post.content.replace(/<[^>]*>?/gm, '').substring(0, 150)}...
                  </p>
                  
                  <div className="mt-auto flex items-center gap-3 pt-6 border-t border-white/10">
                    <div className="h-8 w-8 rounded-full bg-electric-yellow/20 flex items-center justify-center text-electric-yellow font-display font-bold">
                      {post.author?.name ? post.author.name.charAt(0) : 'U'}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-300">{post.author?.name || 'Desconocido'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
