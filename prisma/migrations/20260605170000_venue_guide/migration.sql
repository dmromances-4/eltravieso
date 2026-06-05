-- CreateEnum
CREATE TYPE "ReservationProvider" AS ENUM ('COVER_MANAGER', 'THE_FORK', 'SEVEN_ROOMS', 'OPEN_TABLE', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "Worlds50BestCategory" AS ENUM ('BARS', 'RESTAURANTS');

-- CreateEnum
CREATE TYPE "VenueSource" AS ENUM ('WORLDS_50_BEST', 'MANUAL');

-- AlterTable
ALTER TABLE "BarProfile" ADD COLUMN     "slug" TEXT,
ADD COLUMN     "history" TEXT,
ADD COLUMN     "foundationYear" INTEGER,
ADD COLUMN     "signatureDrink" TEXT,
ADD COLUMN     "dressCode" TEXT,
ADD COLUMN     "vibeTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "verdict" TEXT,
ADD COLUMN     "reservationProvider" "ReservationProvider",
ADD COLUMN     "reservationUrl" TEXT;

-- CreateTable
CREATE TABLE "VenueGuideEntry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT,
    "address" TEXT,
    "venueType" TEXT NOT NULL,
    "photoUrl" TEXT,
    "history" TEXT,
    "verdict" TEXT,
    "chefName" TEXT,
    "worlds50bestRank" INTEGER NOT NULL,
    "worlds50bestCategory" "Worlds50BestCategory" NOT NULL,
    "worlds50bestYear" INTEGER,
    "sourceUrl" TEXT NOT NULL,
    "externalWebsite" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "barProfileId" TEXT,
    "source" "VenueSource" NOT NULL DEFAULT 'WORLDS_50_BEST',
    "scrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueGuideEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BarProfile_slug_key" ON "BarProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VenueGuideEntry_slug_key" ON "VenueGuideEntry"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VenueGuideEntry_sourceUrl_key" ON "VenueGuideEntry"("sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "VenueGuideEntry_barProfileId_key" ON "VenueGuideEntry"("barProfileId");

-- CreateIndex
CREATE INDEX "VenueGuideEntry_worlds50bestCategory_worlds50bestRank_idx" ON "VenueGuideEntry"("worlds50bestCategory", "worlds50bestRank");

-- CreateIndex
CREATE INDEX "VenueGuideEntry_city_idx" ON "VenueGuideEntry"("city");

-- AddForeignKey
ALTER TABLE "VenueGuideEntry" ADD CONSTRAINT "VenueGuideEntry_barProfileId_fkey" FOREIGN KEY ("barProfileId") REFERENCES "BarProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
