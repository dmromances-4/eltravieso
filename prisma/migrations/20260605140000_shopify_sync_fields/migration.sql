-- AlterTable
ALTER TABLE "BarProfile" ADD COLUMN IF NOT EXISTS "shopifyAccessToken" TEXT;
ALTER TABLE "BarProfile" ADD COLUMN IF NOT EXISTS "shopifyScopes" TEXT;
ALTER TABLE "BarProfile" ADD COLUMN IF NOT EXISTS "shopifyLastSyncAt" TIMESTAMP(3);
ALTER TABLE "BarProfile" ADD COLUMN IF NOT EXISTS "shopifySyncStatus" TEXT;
ALTER TABLE "BarProfile" ADD COLUMN IF NOT EXISTS "shopifySyncError" TEXT;
