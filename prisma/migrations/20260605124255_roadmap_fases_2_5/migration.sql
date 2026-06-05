-- AlterTable
ALTER TABLE "BarProfile" ADD COLUMN     "isPublicOnMap" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "shopifyApiKey" TEXT,
ADD COLUMN     "shopifyShopName" TEXT,
ADD COLUMN     "venueType" TEXT;

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "glass" TEXT;
