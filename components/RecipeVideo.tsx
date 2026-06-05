// Renders a video tutorial for a recipe. Supports YouTube, Vimeo and direct
// video file URLs (mp4/webm/ogg). Returns null when no usable URL is provided.

function isVideoFilePath(pathname: string) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(pathname);
}

function toEmbedUrl(url: string): { kind: "iframe" | "file"; src: string } | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Local uploads served from /public (e.g. /uploads/recipe-videos/foo.mp4)
  if (trimmed.startsWith("/") && isVideoFilePath(trimmed)) {
    return { kind: "file", src: trimmed };
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` };
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` };
    }
    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
    }
    if (host === "player.vimeo.com" || host === "youtube.com") {
      return { kind: "iframe", src: trimmed };
    }
    if (isVideoFilePath(parsed.pathname)) {
      return { kind: "file", src: trimmed };
    }
  } catch {
    return null;
  }
  return null;
}

export default function RecipeVideo({ url }: { url?: string | null }) {
  if (!url) return null;
  const embed = toEmbedUrl(url);
  if (!embed) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-display font-bold text-white">Vídeo-tutorial</h2>
      <div className="relative aspect-video w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-neon">
        {embed.kind === "iframe" ? (
          <iframe
            src={embed.src}
            title="Vídeo-tutorial de la receta"
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video src={embed.src} controls playsInline className="absolute inset-0 h-full w-full" />
        )}
      </div>
    </section>
  );
}
