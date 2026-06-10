export type PlayerMode = "iframe" | "video" | "audio" | "hls" | "unknown";

export type ParsedMediaUrl = {
  mode: PlayerMode;
  src: string;
  provider?: string;
};

function isVideoFilePath(pathname: string) {
  return /\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(pathname);
}

function isAudioFilePath(pathname: string) {
  return /\.(mp3|m4a|wav|ogg)(\?.*)?$/i.test(pathname);
}

export function parseMediaUrl(url?: string | null): ParsedMediaUrl | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/") && isVideoFilePath(trimmed)) {
    return { mode: trimmed.includes(".m3u8") ? "hls" : "video", src: trimmed };
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      if (id) return { mode: "iframe", src: `https://www.youtube.com/embed/${id}`, provider: "youtube" };
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      if (id) return { mode: "iframe", src: `https://www.youtube.com/embed/${id}`, provider: "youtube" };
    }
    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (id) return { mode: "iframe", src: `https://player.vimeo.com/video/${id}`, provider: "vimeo" };
    }
    if (host === "player.vimeo.com") {
      return { mode: "iframe", src: trimmed, provider: "vimeo" };
    }
    if (host === "open.spotify.com" || host === "spotify.com") {
      const embed = trimmed.includes("/embed/")
        ? trimmed
        : trimmed.replace("open.spotify.com/", "open.spotify.com/embed/");
      return { mode: "iframe", src: embed, provider: "spotify" };
    }
    if (host === "podcasts.apple.com") {
      return { mode: "iframe", src: trimmed.replace("podcasts.apple.com/", "embed.podcasts.apple.com/"), provider: "apple" };
    }
    if (host === "embed.podcasts.apple.com") {
      return { mode: "iframe", src: trimmed, provider: "apple" };
    }
    if (parsed.pathname.endsWith(".m3u8") || parsed.pathname.includes(".m3u8")) {
      return { mode: "hls", src: trimmed, provider: "hls" };
    }
    if (isVideoFilePath(parsed.pathname)) {
      return { mode: "video", src: trimmed };
    }
    if (isAudioFilePath(parsed.pathname)) {
      return { mode: "audio", src: trimmed, provider: "audio" };
    }
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return { mode: "iframe", src: trimmed, provider: "external" };
    }
  } catch {
    return null;
  }

  return null;
}

export function resolvePlaybackUrl(mediaUrl?: string | null, playbackUrl?: string | null) {
  return parseMediaUrl(playbackUrl) ?? parseMediaUrl(mediaUrl);
}
