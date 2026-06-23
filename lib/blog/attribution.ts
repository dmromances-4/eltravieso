export function buildWrittenAttributionBlock(options: {
  authorName: string;
  publisher?: string;
  publishedAt?: Date;
  sourceUrl: string;
}): string {
  const dateStr = options.publishedAt
    ? options.publishedAt.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const where = [options.publisher, dateStr].filter(Boolean).join(", ");
  return `
<aside class="syndication-footer rounded-2xl border border-white/10 bg-white/5 p-6 mt-12 not-prose">
  <p class="text-sm text-slate-400 leading-relaxed">
    Extracto publicado originalmente por <strong class="text-slate-200">${escapeAttr(options.authorName)}</strong>${where ? ` en ${escapeAttr(where)}` : ""}.
  </p>
  <a href="${escapeAttr(options.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex mt-4 text-sm font-bold uppercase tracking-widest text-electric-blue hover:text-electric-yellow">
    Leer el artículo completo →
  </a>
</aside>`;
}

export function buildVideoAttributionBlock(options: {
  authorName: string;
  sourceUrl: string;
}): string {
  return `
<aside class="syndication-footer rounded-2xl border border-white/10 bg-white/5 p-6 mt-8">
  <p class="text-sm text-slate-400">
    Vídeo de <strong class="text-slate-200">${escapeAttr(options.authorName)}</strong>.
  </p>
  <a href="${escapeAttr(options.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex mt-4 text-sm font-bold uppercase tracking-widest text-electric-blue hover:text-electric-yellow">
    Ver en el canal original →
  </a>
</aside>`;
}

export function buildPodcastAttributionBlock(options: {
  authorName: string;
  sourceUrl: string;
}): string {
  return `
<aside class="syndication-footer rounded-2xl border border-white/10 bg-white/5 p-6 mt-8">
  <p class="text-sm text-slate-400">
    Episodio de podcast de <strong class="text-slate-200">${escapeAttr(options.authorName)}</strong>.
  </p>
  <a href="${escapeAttr(options.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex mt-4 text-sm font-bold uppercase tracking-widest text-electric-blue hover:text-electric-yellow">
    Escuchar en la fuente original →
  </a>
</aside>`;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
