-- Pantalla media catalog

CREATE TYPE "MediaKind" AS ENUM ('FILM', 'SERIES', 'SERIES_EPISODE', 'PODCAST_SHOW', 'PODCAST_EPISODE', 'EVENT_VIDEO');
CREATE TYPE "MediaSourceType" AS ENUM ('EMBED', 'UPLOAD', 'EXTERNAL_URL');
CREATE TYPE "MediaPublishStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "LiveCategory" AS ENUM ('GOLF', 'SPORTS', 'CULTURE', 'OTHER');

CREATE TABLE "MediaItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "summary" TEXT,
    "coverUrl" TEXT,
    "mediaUrl" TEXT,
    "playbackUrl" TEXT,
    "sourceType" "MediaSourceType" NOT NULL DEFAULT 'EMBED',
    "parentId" TEXT,
    "seasonNumber" INTEGER,
    "episodeNumber" INTEGER,
    "eventDate" TIMESTAMP(3),
    "cocktailSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "MediaPublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "barProfileId" TEXT,
    "createdById" TEXT NOT NULL,
    "tmdbId" INTEGER,
    "tmdbType" TEXT,
    "imdbId" TEXT,
    "releaseYear" INTEGER,
    "runtimeMins" INTEGER,
    "metadata" JSONB,
    "episodeGuid" TEXT,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PodcastFeed" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rssUrl" TEXT NOT NULL,
    "coverUrl" TEXT,
    "mediaItemId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PodcastFeed_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LiveStream" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "LiveCategory" NOT NULL DEFAULT 'OTHER',
    "embedUrl" TEXT NOT NULL,
    "backupEmbedUrl" TEXT,
    "isLive" BOOLEAN NOT NULL DEFAULT true,
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "coverUrl" TEXT,
    "summary" TEXT,
    "status" "MediaPublishStatus" NOT NULL DEFAULT 'DRAFT',
    "curatedById" TEXT NOT NULL,
    "sourceLabel" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "lastCheckOk" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveStream_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaComment" (
    "id" TEXT NOT NULL,
    "mediaItemId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaRating" (
    "id" TEXT NOT NULL,
    "mediaItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaRating_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MediaItem_slug_key" ON "MediaItem"("slug");
CREATE INDEX "MediaItem_kind_idx" ON "MediaItem"("kind");
CREATE INDEX "MediaItem_status_idx" ON "MediaItem"("status");
CREATE INDEX "MediaItem_slug_idx" ON "MediaItem"("slug");
CREATE INDEX "MediaItem_parentId_idx" ON "MediaItem"("parentId");
CREATE INDEX "MediaItem_barProfileId_idx" ON "MediaItem"("barProfileId");
CREATE INDEX "MediaItem_createdById_idx" ON "MediaItem"("createdById");
CREATE INDEX "MediaItem_tmdbId_idx" ON "MediaItem"("tmdbId");
CREATE INDEX "MediaItem_episodeGuid_idx" ON "MediaItem"("episodeGuid");

CREATE UNIQUE INDEX "PodcastFeed_rssUrl_key" ON "PodcastFeed"("rssUrl");
CREATE UNIQUE INDEX "PodcastFeed_mediaItemId_key" ON "PodcastFeed"("mediaItemId");

CREATE UNIQUE INDEX "LiveStream_slug_key" ON "LiveStream"("slug");
CREATE INDEX "LiveStream_status_idx" ON "LiveStream"("status");
CREATE INDEX "LiveStream_category_idx" ON "LiveStream"("category");
CREATE INDEX "LiveStream_isLive_idx" ON "LiveStream"("isLive");
CREATE INDEX "LiveStream_slug_idx" ON "LiveStream"("slug");

CREATE INDEX "MediaComment_mediaItemId_idx" ON "MediaComment"("mediaItemId");
CREATE INDEX "MediaComment_authorId_idx" ON "MediaComment"("authorId");
CREATE INDEX "MediaComment_parentId_idx" ON "MediaComment"("parentId");

CREATE UNIQUE INDEX "MediaRating_mediaItemId_userId_key" ON "MediaRating"("mediaItemId", "userId");
CREATE INDEX "MediaRating_mediaItemId_idx" ON "MediaRating"("mediaItemId");
CREATE INDEX "MediaRating_userId_idx" ON "MediaRating"("userId");

ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MediaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_barProfileId_fkey" FOREIGN KEY ("barProfileId") REFERENCES "BarProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PodcastFeed" ADD CONSTRAINT "PodcastFeed_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "MediaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LiveStream" ADD CONSTRAINT "LiveStream_curatedById_fkey" FOREIGN KEY ("curatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MediaComment" ADD CONSTRAINT "MediaComment_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "MediaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaComment" ADD CONSTRAINT "MediaComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaComment" ADD CONSTRAINT "MediaComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MediaComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MediaRating" ADD CONSTRAINT "MediaRating_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "MediaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaRating" ADD CONSTRAINT "MediaRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
