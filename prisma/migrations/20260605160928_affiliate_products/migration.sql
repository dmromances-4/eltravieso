-- CreateEnum
CREATE TYPE "AffiliatePlatform" AS ENUM ('AMAZON', 'TEMU', 'ALIEXPRESS', 'NONE');

-- AlterEnum
ALTER TYPE "ProductSource" ADD VALUE 'AFILIADO';

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropIndex
DROP INDEX "VenueGuideEntry_continent_idx";

-- AlterTable
ALTER TABLE "BarProfile" ALTER COLUMN "vibeTags" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MembershipDropFulfillment" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "affiliatePlatform" "AffiliatePlatform" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "affiliateUrl" TEXT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
