export default function AdminPostsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Blog Posts</h2>
        <a href="/admin/posts/new" className="bg-red-600 text-white px-4 py-2 rounded">New Post</a>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded p-4">
        <p className="text-zinc-400">No posts yet — use this area to create and manage SEO content. For full management, this page will be enhanced to query `prisma.blogPost` once the Prisma client types are available.</p>
      </div>
    </div>
  );
}
