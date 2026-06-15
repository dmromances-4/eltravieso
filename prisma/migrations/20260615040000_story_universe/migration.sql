-- Story Universe models
CREATE TYPE "StoryStatus" AS ENUM ('DRAFT', 'QC_PASSED', 'QC_FAILED', 'APPROVED', 'SCRIPTED', 'STORYBOARDED', 'READY');

CREATE TABLE "CocktailNarrativeProfile" (
    "id" TEXT NOT NULL,
    "cocktailSlug" TEXT NOT NULL,
    "cocktailTitle" TEXT NOT NULL,
    "aromaticProfile" TEXT[],
    "tasteProfile" TEXT[],
    "color" TEXT NOT NULL,
    "intensity" INTEGER NOT NULL DEFAULT 3,
    "personality" TEXT[],
    "symbolism" TEXT[],
    "evokedSensations" TEXT[],
    "narrativeHooks" TEXT[],
    "originHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CocktailNarrativeProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "logline" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "subthemes" TEXT[],
    "cocktailSlug" TEXT NOT NULL,
    "emotionProfile" JSONB NOT NULL,
    "characterList" JSONB NOT NULL,
    "locations" JSONB NOT NULL,
    "conflict" JSONB NOT NULL,
    "resolution" JSONB NOT NULL,
    "visualIdentity" JSONB NOT NULL,
    "animationPotential" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "categoryId" TEXT NOT NULL,
    "status" "StoryStatus" NOT NULL DEFAULT 'DRAFT',
    "qcScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StoryScript" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "synopsis" TEXT NOT NULL,
    "treatment" TEXT NOT NULL,
    "screenplay" JSONB NOT NULL,
    "estimatedRuntimeMins" INTEGER NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryScript_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StoryStoryboard" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "scenes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryStoryboard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StoryAnimationPrompt" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "sceneNumber" INTEGER NOT NULL,
    "prompts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryAnimationPrompt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CocktailNarrativeProfile_cocktailSlug_key" ON "CocktailNarrativeProfile"("cocktailSlug");
CREATE INDEX "CocktailNarrativeProfile_cocktailSlug_idx" ON "CocktailNarrativeProfile"("cocktailSlug");

CREATE UNIQUE INDEX "Story_storyId_key" ON "Story"("storyId");
CREATE INDEX "Story_cocktailSlug_idx" ON "Story"("cocktailSlug");
CREATE INDEX "Story_categoryId_idx" ON "Story"("categoryId");
CREATE INDEX "Story_status_idx" ON "Story"("status");

CREATE UNIQUE INDEX "StoryScript_storyId_key" ON "StoryScript"("storyId");

CREATE UNIQUE INDEX "StoryStoryboard_storyId_key" ON "StoryStoryboard"("storyId");

CREATE UNIQUE INDEX "StoryAnimationPrompt_storyId_sceneNumber_key" ON "StoryAnimationPrompt"("storyId", "sceneNumber");
CREATE INDEX "StoryAnimationPrompt_storyId_idx" ON "StoryAnimationPrompt"("storyId");

ALTER TABLE "Story" ADD CONSTRAINT "Story_cocktailSlug_fkey" FOREIGN KEY ("cocktailSlug") REFERENCES "CocktailNarrativeProfile"("cocktailSlug") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StoryScript" ADD CONSTRAINT "StoryScript_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StoryStoryboard" ADD CONSTRAINT "StoryStoryboard_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StoryAnimationPrompt" ADD CONSTRAINT "StoryAnimationPrompt_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
