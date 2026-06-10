"use client";

import { parseMediaUrl, resolvePlaybackUrl } from "@/lib/media/player";

type MediaPlayerProps = {
  mediaUrl?: string | null;
  playbackUrl?: string | null;
  title?: string;
};

export default function MediaPlayer({ mediaUrl, playbackUrl, title }: MediaPlayerProps) {
  const parsed = resolvePlaybackUrl(mediaUrl, playbackUrl);
  if (!parsed) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-neon">
      {parsed.mode === "iframe" ? (
        <iframe
          src={parsed.src}
          title={title ?? "Reproductor"}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          src={parsed.src}
          controls
          playsInline
          className="absolute inset-0 h-full w-full"
          {...(parsed.mode === "hls" ? { crossOrigin: "anonymous" } : {})}
        />
      )}
    </div>
  );
}

export { parseMediaUrl };
