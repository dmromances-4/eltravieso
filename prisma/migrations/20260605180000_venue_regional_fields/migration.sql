-- CreateEnum
CREATE TYPE "VenueContinent" AS ENUM ('GLOBAL', 'EUROPE', 'ASIA', 'NORTH_AMERICA', 'LATIN_AMERICA', 'MIDDLE_EAST_AFRICA', 'OCEANIA');

-- CreateEnum
CREATE TYPE "VenueListScope" AS ENUM ('GLOBAL', 'REGIONAL');

-- AlterTable
ALTER TABLE "VenueGuideEntry" ADD COLUMN     "continent" "VenueContinent",
ADD COLUMN     "listScope" "VenueListScope" NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN     "regionalRank" INTEGER,
ADD COLUMN     "additionalRankings" JSONB,
ADD COLUMN     "tripadvisorUrl" TEXT,
ADD COLUMN     "tripadvisorRating" DOUBLE PRECISION,
ADD COLUMN     "enrichmentSource" TEXT;

-- CreateIndex
CREATE INDEX "VenueGuideEntry_continent_idx" ON "VenueGuideEntry"("continent");
