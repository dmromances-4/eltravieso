import type { LiveCategory, MediaKind, MediaPublishStatus, MediaSourceType } from "@prisma/client";

export type CreateMediaInput = {
  title: string;
  kind: MediaKind;
  summary?: string | null;
  coverUrl?: string | null;
  mediaUrl?: string | null;
  playbackUrl?: string | null;
  sourceType?: MediaSourceType;
  parentId?: string | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  eventDate?: string | null;
  cocktailSlugs?: string[];
  tags?: string[];
  status?: MediaPublishStatus;
  barProfileId?: string | null;
  tmdbId?: number | null;
  tmdbType?: string | null;
  imdbId?: string | null;
  releaseYear?: number | null;
  runtimeMins?: number | null;
  metadata?: Record<string, unknown> | null;
  episodeGuid?: string | null;
};

export type CreateLiveStreamInput = {
  title: string;
  category?: LiveCategory;
  embedUrl: string;
  backupEmbedUrl?: string | null;
  isLive?: boolean;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  coverUrl?: string | null;
  summary?: string | null;
  status?: MediaPublishStatus;
  sourceLabel?: string | null;
};

export const MEDIA_KIND_LABELS: Record<MediaKind, string> = {
  FILM: "Película",
  SERIES: "Serie",
  SERIES_EPISODE: "Episodio",
  PODCAST_SHOW: "Podcast",
  PODCAST_EPISODE: "Episodio podcast",
  EVENT_VIDEO: "Evento",
};

export const LIVE_CATEGORY_LABELS: Record<LiveCategory, string> = {
  GOLF: "Golf",
  SPORTS: "Deportes",
  CULTURE: "Cultura",
  OTHER: "Otros",
};

export const HUB_KINDS: MediaKind[] = ["FILM", "SERIES", "PODCAST_SHOW", "EVENT_VIDEO"];
