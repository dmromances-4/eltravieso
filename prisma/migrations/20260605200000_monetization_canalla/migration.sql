-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('NONE', 'ACTIVE', 'PAST_DUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProductSource" AS ENUM ('PROPIO', 'MARKETPLACE', 'AFILIADO');

-- CreateEnum
CREATE TYPE "MapPlanTier" AS ENUM ('FREE', 'FEATURED', 'BOOKING_PLUS');

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "stripeSubscriptionId" TEXT,
ADD COLUMN "membershipStatus" "MembershipStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN "membershipExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN "source" "ProductSource" NOT NULL DEFAULT 'PROPIO',
ADD COLUMN "partnerId" TEXT,
ADD COLUMN "commissionRateBps" INTEGER NOT NULL DEFAULT 2000;

CREATE INDEX "Product_source_idx" ON "Product"("source");
CREATE INDEX "Product_partnerId_idx" ON "Product"("partnerId");

ALTER TABLE "Product" ADD CONSTRAINT "Product_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill marketplace products from metadata
UPDATE "Product"
SET
  "source" = 'MARKETPLACE',
  "partnerId" = ("metadata"->>'sellerId')::text,
  "commissionRateBps" = 2000
WHERE "metadata"->>'source' = 'marketplace'
  AND "metadata"->>'sellerId' IS NOT NULL;

-- AlterTable Order
ALTER TABLE "Order" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Order" ADD COLUMN "guestEmail" TEXT,
ADD COLUMN "stripeSessionId" TEXT;

CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");
CREATE INDEX "Order_stripeSessionId_idx" ON "Order"("stripeSessionId");

-- CreateTable OrderSplitLine
CREATE TABLE "OrderSplitLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "partnerId" TEXT,
    "grossCents" INTEGER NOT NULL,
    "platformCents" INTEGER NOT NULL,
    "partnerCents" INTEGER NOT NULL,
    "settled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderSplitLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderSplitLine_orderItemId_key" ON "OrderSplitLine"("orderItemId");
CREATE INDEX "OrderSplitLine_orderId_idx" ON "OrderSplitLine"("orderId");
CREATE INDEX "OrderSplitLine_partnerId_idx" ON "OrderSplitLine"("partnerId");
CREATE INDEX "OrderSplitLine_settled_idx" ON "OrderSplitLine"("settled");

ALTER TABLE "OrderSplitLine" ADD CONSTRAINT "OrderSplitLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderSplitLine" ADD CONSTRAINT "OrderSplitLine_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable MembershipDropFulfillment
CREATE TABLE "MembershipDropFulfillment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dropMonth" TEXT NOT NULL,
    "productId" TEXT,
    "orderId" TEXT,
    "fulfilledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipDropFulfillment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MembershipDropFulfillment_userId_dropMonth_key" ON "MembershipDropFulfillment"("userId", "dropMonth");
CREATE INDEX "MembershipDropFulfillment_userId_idx" ON "MembershipDropFulfillment"("userId");

ALTER TABLE "MembershipDropFulfillment" ADD CONSTRAINT "MembershipDropFulfillment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable BarProfile
ALTER TABLE "BarProfile" ADD COLUMN "mapPlan" "MapPlanTier" NOT NULL DEFAULT 'FREE',
ADD COLUMN "mapPlanExpiresAt" TIMESTAMP(3),
ADD COLUMN "stripeSubscriptionId" TEXT,
ADD COLUMN "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "bookingWidgetEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "BarProfile_stripeSubscriptionId_key" ON "BarProfile"("stripeSubscriptionId");

-- AlterTable Recipe
ALTER TABLE "Recipe" ADD COLUMN "isPremium" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable BlogPost
ALTER TABLE "BlogPost" ADD COLUMN "isPremium" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "BlogPost_isPremium_idx" ON "BlogPost"("isPremium");

-- AlterTable BarOnlineSession
ALTER TABLE "BarOnlineSession" ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "hdEnabled" BOOLEAN NOT NULL DEFAULT false;
