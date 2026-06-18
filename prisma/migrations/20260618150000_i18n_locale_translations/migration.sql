-- AlterTable
ALTER TABLE "User" ADD COLUMN "preferredLocale" TEXT NOT NULL DEFAULT 'es';

-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'es';

-- CreateTable
CREATE TABLE "RecipeTranslation" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "glass" TEXT,
    "ingredients" TEXT NOT NULL,
    "method" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecipeTranslation_locale_idx" ON "RecipeTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeTranslation_recipeId_locale_key" ON "RecipeTranslation"("recipeId", "locale");

-- AddForeignKey
ALTER TABLE "RecipeTranslation" ADD CONSTRAINT "RecipeTranslation_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
