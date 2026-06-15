import prisma from "@/lib/prisma";
import { appendStoryUniverseChangelog } from "../changelog";
import { buildSceneAnimationPrompts, episodeStyleSeedFromStory } from "../animation/build-scene-prompts";
import type { StoryboardScene, StoryDraft } from "../types";

export async function runGenerateAnimationPrompts(opts: {
  limit?: number;
  storyId?: string;
  dryRun?: boolean;
}): Promise<{ ok: number; prompts: number }> {
  const stories = await prisma.story.findMany({
    where: opts.storyId ? { storyId: opts.storyId } : { status: "STORYBOARDED" },
    include: { storyboard: true },
    take: opts.limit ?? 20,
  });

  let ok = 0;
  let prompts = 0;

  for (const row of stories) {
    if (!row.storyboard) continue;

    const draft: StoryDraft = {
      storyId: row.storyId,
      title: row.title,
      logline: row.logline,
      theme: row.theme,
      subthemes: row.subthemes,
      cocktailReference: row.cocktailSlug,
      emotionProfile: row.emotionProfile as Record<string, number>,
      characterList: row.characterList as StoryDraft["characterList"],
      locations: row.locations as StoryDraft["locations"],
      conflict: row.conflict as StoryDraft["conflict"],
      resolution: row.resolution as StoryDraft["resolution"],
      visualIdentity: row.visualIdentity as StoryDraft["visualIdentity"],
      animationPotential: row.animationPotential,
      categoryId: row.categoryId,
    };

    const scenes = row.storyboard.scenes as StoryboardScene[];
    const styleSeed = episodeStyleSeedFromStory(draft);
    const bundles = buildSceneAnimationPrompts(draft, scenes, styleSeed);

    if (opts.dryRun) {
      console.log(JSON.stringify({ storyId: row.storyId, promptCount: bundles.length, sample: bundles[0] }, null, 2));
      ok += 1;
      prompts += bundles.length;
      continue;
    }

    for (const bundle of bundles) {
      await prisma.storyAnimationPrompt.upsert({
        where: { storyId_sceneNumber: { storyId: row.id, sceneNumber: bundle.sceneNumber } },
        create: { storyId: row.id, sceneNumber: bundle.sceneNumber, prompts: bundle },
        update: { prompts: bundle },
      });
      prompts += 1;
    }

    await prisma.story.update({ where: { id: row.id }, data: { status: "READY" } });
    ok += 1;
  }

  await appendStoryUniverseChangelog(`generate-animation-prompts: stories=${ok}, prompts=${prompts}`);
  return { ok, prompts };
}
