-- Identificadores de catálogo y plataformas externas
ALTER TABLE "BarProfile" ADD COLUMN IF NOT EXISTS "tripadvisorPlaceId" TEXT;
ALTER TABLE "BarProfile" ADD COLUMN IF NOT EXISTS "venueCode" TEXT;

ALTER TABLE "VenueGuideEntry" ADD COLUMN IF NOT EXISTS "googleBusinessId" TEXT;
ALTER TABLE "VenueGuideEntry" ADD COLUMN IF NOT EXISTS "tripadvisorPlaceId" TEXT;
ALTER TABLE "VenueGuideEntry" ADD COLUMN IF NOT EXISTS "venueCode" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "BarProfile_venueCode_key" ON "BarProfile"("venueCode");
CREATE UNIQUE INDEX IF NOT EXISTS "VenueGuideEntry_venueCode_key" ON "VenueGuideEntry"("venueCode");
