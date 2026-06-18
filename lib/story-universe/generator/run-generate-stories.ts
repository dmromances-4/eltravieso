import { readFile, writeFile } from "fs/promises";
import prisma from "@/lib/prisma";
import { appendStoryUniverseChangelog } from "../changelog";
import { getStoryAiThrottleMs, STORY_PROGRESS_PATH } from "../paths";
import { runStoryQc } from "../qc/validate";
import type { CocktailNarrativeProfile, StoryDraft } from "../types";
import { loadGenerationQuotas, loadUniverseCategories } from "../taxonomy/universe";
import {
  formatStoryId,
  generateStoryDraft,
  maxStoryNumber,
  selectCategoryForQuota,
  storySeed,
} from "./generate-story";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type ProgressFile = {
  completedStoryIds: string[];
  categoryCounts: Record<string, number>;
  updatedAt: string;
};

async function loadProgress(): Promise<ProgressFile> {
  try {
    return JSON.parse(await readFile(STORY_PROGRESS_PATH, "utf8")) as ProgressFile;
  } catch {
    return { completedStoryIds: [], categoryCounts: {}, updatedAt: new Date().toISOString() };
  }
}

async function saveProgress(progress: ProgressFile): Promise<void> {
  progress.updatedAt = new Date().toISOString();
  await writeFile(STORY_PROGRESS_PATH, JSON.stringify(progress, null, 2), "utf8");
}

export type GenerateStoriesOptions = {
  limit?: number;
  slug?: string;
  category?: string;
  force?: boolean;
  dryRun?: boolean;
  discoverOnly?: boolean;
  useAi?: boolean;
  targetTotal?: number;
};

export async function runGenerateStories(opts: GenerateStoriesOptions = {}): Promise<{
  created: number;
  failed: number;
  skipped: number;
}> {
  const categories = await loadUniverseCategories();
  const quotas = await loadGenerationQuotas();
  const targetTotal = opts.targetTotal ?? quotas.reduce((s, q) => s + q.targetCount, 0);

  let profiles = await prisma.cocktailNarrativeProfile.findMany();
  if (profiles.length === 0) {
    throw new Error("No hay perfiles de cóctel. Ejecuta build-cocktail-profiles primero.");
  }
  if (opts.slug) profiles = profiles.filter((p) => p.cocktailSlug === opts.slug);

  const existingStories = await prisma.story.findMany({ select: { storyId: true, logline: true, categoryId: true } });
  const existingLoglines = existingStories.map((s) => s.logline);
  const progress = await loadProgress();
  const categoryCounts: Record<string, number> = { ...progress.categoryCounts };

  for (const s of existingStories) {
    categoryCounts[s.categoryId] = (categoryCounts[s.categoryId] ?? 0) + 1;
  }

  let created = 0;
  let failed = 0;
  let skipped = 0;
  const batchLimit = opts.limit ?? Math.max(0, targetTotal - existingStories.length);
  const throttle = getStoryAiThrottleMs();
  let nextStoryNum = maxStoryNumber(existingStories.map((s) => s.storyId)) + 1;

  for (let i = 0; i < batchLimit; i += 1) {
    const storyIndex = existingStories.length + created + i;
    const profileRow = profiles[storyIndex % profiles.length]!;
    const profile: CocktailNarrativeProfile = {
      cocktailSlug: profileRow.cocktailSlug,
      cocktailTitle: profileRow.cocktailTitle,
      aromaticProfile: profileRow.aromaticProfile,
      tasteProfile: profileRow.tasteProfile,
      color: profileRow.color,
      intensity: profileRow.intensity as 1 | 2 | 3 | 4 | 5,
      personality: profileRow.personality,
      symbolism: profileRow.symbolism,
      evokedSensations: profileRow.evokedSensations,
      narrativeHooks: profileRow.narrativeHooks,
      originHint: profileRow.originHint ?? undefined,
    };

    const seed = storySeed(profile.cocktailSlug, storyIndex, "batch");
    let category = selectCategoryForQuota(categories, quotas, categoryCounts, seed);
    if (opts.category) {
      category = categories.find((c) => c.id === opts.category) ?? category;
    }

    const storyId = formatStoryId(nextStoryNum);
    nextStoryNum += 1;
    if (!opts.force && progress.completedStoryIds.includes(storyId)) {
      skipped += 1;
      continue;
    }

    let draft: StoryDraft | null = null;
    let qc = runStoryQc(
      { storyId, title: "", logline: "", theme: "", subthemes: [], cocktailReference: profile.cocktailSlug, emotionProfile: {}, characterList: [], locations: [], conflict: { type: "", description: "", stakes: "" }, resolution: { type: "", description: "" }, visualIdentity: { palette: [], lighting: "", era: "", mood: "" }, animationPotential: 0, categoryId: category.id },
      profile,
      existingLoglines,
    );

    for (let attempt = 0; attempt < 3; attempt += 1) {
      draft = await generateStoryDraft({
        profile,
        category,
        storyIndex: storyIndex + attempt,
        storyId,
        useAi: opts.useAi,
      });
      qc = runStoryQc(draft, profile, existingLoglines);
      if (qc.passed) break;
    }

    if (!draft) {
      failed += 1;
      continue;
    }
    draft.storyId = storyId;
    draft.cocktailReference = profile.cocktailSlug;

    if (opts.discoverOnly || opts.dryRun) {
      console.log(JSON.stringify({ draft, qc }, null, 2));
      created += 1;
      continue;
    }

    const status = qc.passed ? "QC_PASSED" : "QC_FAILED";

    await prisma.story.create({
      data: {
        storyId: draft.storyId,
        title: draft.title,
        logline: draft.logline,
        theme: draft.theme,
        subthemes: draft.subthemes,
        cocktailSlug: draft.cocktailReference,
        emotionProfile: draft.emotionProfile,
        characterList: draft.characterList,
        locations: draft.locations,
        conflict: draft.conflict,
        resolution: draft.resolution,
        visualIdentity: draft.visualIdentity,
        animationPotential: draft.animationPotential,
        categoryId: draft.categoryId,
        status,
        qcScore: qc.score,
      },
    });

    existingLoglines.push(draft.logline);
    categoryCounts[category.id] = (categoryCounts[category.id] ?? 0) + 1;
    progress.completedStoryIds.push(storyId);
    await saveProgress(progress);

    if (qc.passed) created += 1;
    else failed += 1;

    if (throttle > 0) await sleep(throttle);
  }

  await appendStoryUniverseChangelog(`generate-stories: created=${created}, failed=${failed}, skipped=${skipped}`);
  return { created, failed, skipped };
}
