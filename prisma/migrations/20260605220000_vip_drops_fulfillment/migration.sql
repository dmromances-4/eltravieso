-- CreateEnum
CREATE TYPE "DropFulfillmentStatus" AS ENUM ('PENDING_PRODUCT', 'PENDING_ADDRESS', 'ORDER_CREATED', 'FULFILLED');

-- CreateTable
CREATE TABLE "VipMonthlyDrop" (
    "id" TEXT NOT NULL,
    "dropMonth" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VipMonthlyDrop_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "MembershipDropFulfillment" ADD COLUMN "status" "DropFulfillmentStatus" NOT NULL DEFAULT 'PENDING_PRODUCT';
ALTER TABLE "MembershipDropFulfillment" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "VipMonthlyDrop_dropMonth_key" ON "VipMonthlyDrop"("dropMonth");
CREATE INDEX "VipMonthlyDrop_productId_idx" ON "VipMonthlyDrop"("productId");
CREATE INDEX "MembershipDropFulfillment_status_idx" ON "MembershipDropFulfillment"("status");
CREATE INDEX "MembershipDropFulfillment_dropMonth_idx" ON "MembershipDropFulfillment"("dropMonth");

-- AddForeignKey
ALTER TABLE "VipMonthlyDrop" ADD CONSTRAINT "VipMonthlyDrop_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VipMonthlyDrop" ADD CONSTRAINT "VipMonthlyDrop_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
