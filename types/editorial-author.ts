export type EditorialAuthorTier = "COCKTAIL" | "GASTRONOMY" | "BOTH";

export type EditorialContentKind = "VIDEO" | "PODCAST";

export type BlogSection = "written" | "video" | "podcast";

export interface GastronomicWriterRecord {
  slug: string;
  name: string;
  tagline: string;
  bio: string;
  bioEn?: string;
  whyRead: string;
  country: string;
  city?: string;
  specialties: string[];
  tier: EditorialAuthorTier;
  avatarUrl?: string;
  websiteUrl?: string;
  substackUrl?: string;
  twitterUrl?: string;
  writtenFeedUrls?: string[];
  youtubeChannelId?: string | null;
  podcastFeedUrls?: string[];
  featured?: boolean;
  sortOrder?: number;
}

export interface SyndicationMetadata {
  sourcePublisher?: string;
  excerptWordCount?: number;
  lastSyncedAt?: string;
  episodeGuid?: string;
}
