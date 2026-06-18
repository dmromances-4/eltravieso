-- Campos editoriales de locales (identidad, ambiente, precios, preferencias, links)

ALTER TABLE "BarProfile" ADD COLUMN "establishmentTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "BarProfile" ADD COLUMN "cuisineTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "BarProfile" ADD COLUMN "starDishes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "BarProfile" ADD COLUMN "idealFor" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "BarProfile" ADD COLUMN "venueFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "BarProfile" ADD COLUMN "neighborhood" TEXT;
ALTER TABLE "BarProfile" ADD COLUMN "priceRange" TEXT;
ALTER TABLE "BarProfile" ADD COLUMN "dailyMenuEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BarProfile" ADD COLUMN "dailyMenuNote" TEXT;
ALTER TABLE "BarProfile" ADD COLUMN "awards" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "BarProfile" ADD COLUMN "venuePreferences" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "BarProfile" ADD COLUMN "instagramUrl" TEXT;
ALTER TABLE "BarProfile" ADD COLUMN "tiktokUrl" TEXT;
ALTER TABLE "BarProfile" ADD COLUMN "tripadvisorUrl" TEXT;

ALTER TABLE "VenueGuideEntry" ADD COLUMN "establishmentTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "VenueGuideEntry" ADD COLUMN "cuisineTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "VenueGuideEntry" ADD COLUMN "starDishes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "VenueGuideEntry" ADD COLUMN "idealFor" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "VenueGuideEntry" ADD COLUMN "venueFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "VenueGuideEntry" ADD COLUMN "neighborhood" TEXT;
ALTER TABLE "VenueGuideEntry" ADD COLUMN "priceRange" TEXT;
ALTER TABLE "VenueGuideEntry" ADD COLUMN "dailyMenuEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "VenueGuideEntry" ADD COLUMN "dailyMenuNote" TEXT;
ALTER TABLE "VenueGuideEntry" ADD COLUMN "awards" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "VenueGuideEntry" ADD COLUMN "venuePreferences" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "VenueGuideEntry" ADD COLUMN "instagramUrl" TEXT;
ALTER TABLE "VenueGuideEntry" ADD COLUMN "tiktokUrl" TEXT;
