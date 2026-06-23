-- CreateEnum
CREATE TYPE "EditorialAuthorTier" AS ENUM ('COCKTAIL', 'GASTRONOMY', 'BOTH');

-- CreateEnum
CREATE TYPE "EditorialContentKind" AS ENUM ('VIDEO', 'PODCAST');

-- CreateTable
CREATE TABLE "EditorialAuthor" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "bio" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tier" "EditorialAuthorTier" NOT NULL DEFAULT 'GASTRONOMY',
    "avatarUrl" TEXT,
    "websiteUrl" TEXT,
    "substackUrl" TEXT,
    "twitterUrl" TEXT,
    "writtenFeedUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "youtubeChannelId" TEXT,
    "podcastFeedUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorialAuthor_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN "editorialAuthorId" TEXT,
ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "sourcePublishedAt" TIMESTAMP(3),
ADD COLUMN "ingestionType" TEXT,
ADD COLUMN "canonicalUrl" TEXT;

-- CreateTable
CREATE TABLE "EditorialCuratedItem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "EditorialContentKind" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "embedUrl" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "coverUrl" TEXT,
    "durationSecs" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "locale" TEXT NOT NULL DEFAULT 'es',
    "editorialAuthorId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorialCuratedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EditorialAuthor_slug_key" ON "EditorialAuthor"("slug");

-- CreateIndex
CREATE INDEX "EditorialAuthor_featured_idx" ON "EditorialAuthor"("featured");

-- CreateIndex
CREATE INDEX "EditorialAuthor_sortOrder_idx" ON "EditorialAuthor"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_sourceUrl_key" ON "BlogPost"("sourceUrl");

-- CreateIndex
CREATE INDEX "BlogPost_editorialAuthorId_idx" ON "BlogPost"("editorialAuthorId");

-- CreateIndex
CREATE INDEX "BlogPost_ingestionType_idx" ON "BlogPost"("ingestionType");

-- CreateIndex
CREATE UNIQUE INDEX "EditorialCuratedItem_slug_key" ON "EditorialCuratedItem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "EditorialCuratedItem_sourceUrl_key" ON "EditorialCuratedItem"("sourceUrl");

-- CreateIndex
CREATE INDEX "EditorialCuratedItem_kind_idx" ON "EditorialCuratedItem"("kind");

-- CreateIndex
CREATE INDEX "EditorialCuratedItem_editorialAuthorId_idx" ON "EditorialCuratedItem"("editorialAuthorId");

-- CreateIndex
CREATE INDEX "EditorialCuratedItem_publishedAt_idx" ON "EditorialCuratedItem"("publishedAt");

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_editorialAuthorId_fkey" FOREIGN KEY ("editorialAuthorId") REFERENCES "EditorialAuthor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialCuratedItem" ADD CONSTRAINT "EditorialCuratedItem_editorialAuthorId_fkey" FOREIGN KEY ("editorialAuthorId") REFERENCES "EditorialAuthor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
