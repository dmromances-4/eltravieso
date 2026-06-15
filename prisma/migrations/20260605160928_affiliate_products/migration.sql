-- CreateEnum
CREATE TYPE "AffiliatePlatform" AS ENUM ('AMAZON', 'TEMU', 'ALIEXPRESS', 'NONE');

-- ProductSource enum is created in monetization_canalla (later migration)

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "affiliatePlatform" "AffiliatePlatform" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "affiliateUrl" TEXT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
