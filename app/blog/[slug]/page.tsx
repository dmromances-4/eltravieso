import { notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import type { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/session'
import { isPremiumContentLocked } from '@/lib/blog/premium'

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } })
  if (!post) return {}
  const description = (post.excerpt ?? post.content).substring(0, 160).replace(/<[^>]*>?/gm, '')
  return {
    title: `${post.title} | Blog Vermut El Travieso`,
    description,
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
    include: { author: true }
  })

  if (!post || !post.published) {
    notFound()
  }

  const session = await getAuthSession()
  const isVip = Boolean(session?.user?.isVip)
  const locked = isPremiumContentLocked(post.isPremium, isVip)

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 text-white">
      <div className="mx-auto max-w-3xl px-6 sm:px-8">
        <Link href="/blog" className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-electric-blue mb-12">
          <span className="transition-transform group-hover:-translate-x-1">←</span> Volver al blog
        </Link>
        
        <article className="space-y-12">
          <header className="space-y-6 border-b border-white/10 pb-12">
            <h1 className="text-4xl font-display font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              <span className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-electric-blue/20 flex items-center justify-center text-electric-blue">
                  {post.author?.name ? post.author.name.charAt(0) : 'U'}
                </span>
                {post.author?.name || 'Desconocido'}
              </span>
              <span>—</span>
              <time>{new Date(post.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
            </div>
            {post.isPremium ? (
              <p className="inline-flex rounded-full border border-electric-red/40 bg-electric-red/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-electric-red">
                Contenido Club VIP
              </p>
            ) : null}
          </header>

          {locked ? (
            <div className="rounded-[2rem] border border-electric-red/30 bg-electric-red/10 p-8 backdrop-blur-xl space-y-4">
              <h2 className="text-2xl font-display font-bold text-white">Artículo premium</h2>
              {post.excerpt ? (
                <p className="text-slate-300 leading-relaxed">{post.excerpt}</p>
              ) : (
                <p className="text-slate-300">
                  Este artículo incluye fichas técnicas de destilados raros y contenido exclusivo del club.
                </p>
              )}
              <Link
                href="/cuenta/membresia"
                className="inline-flex items-center justify-center rounded-full bg-electric-red px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white"
              >
                Unirme al Club de la Trastienda
              </Link>
            </div>
          ) : (
            <div 
              className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-a:text-electric-blue prose-a:no-underline hover:prose-a:text-electric-yellow prose-blockquote:border-l-electric-blue prose-blockquote:bg-white/5 prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:rounded-r-2xl prose-blockquote:font-medium prose-blockquote:italic"
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />
          )}
        </article>
      </div>
    </main>
  )
}
