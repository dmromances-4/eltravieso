-- AlterTable
ALTER TABLE "Product" ADD COLUMN "productCode" TEXT,
ADD COLUMN "encyclopediaSlug" TEXT,
ADD COLUMN "sourceUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_productCode_key" ON "Product"("productCode");
