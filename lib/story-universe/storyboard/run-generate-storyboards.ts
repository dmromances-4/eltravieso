import prisma from "@/lib/prisma";
import { appendStoryUniverseChangelog } from "../changelog";
import { buildStoryboardFromScript } from "../storyboard/build-storyboard";
import type { StoryDraft } from "../types";

export async function runGenerateStoryboards(opts: {
  limit?: number;
  storyId?: string;
  dryRun?: boolean;
}): Promise<{ ok: number }> {
  const stories = await prisma.story.findMany({
    where: opts.storyId ? { storyId: opts.storyId } : { status: "SCRIPTED" },
    include: { script: true, storyboard: true },
    take: opts.limit ?? 50,
  });

  let ok = 0;
  for (const row of stories) {
    if (!row.script || (row.storyboard && !opts.storyId)) continue;

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

    const scriptPayload = {
      synopsis: row.script.synopsis,
      treatment: row.script.treatment,
      screenplay: row.script.screenplay as import("../types").StoryScriptPayload["screenplay"],
      estimatedRuntimeMins: row.script.estimatedRuntimeMins,
      wordCount: row.script.wordCount,
    };

    const scenes = buildStoryboardFromScript(draft, scriptPayload);

    if (opts.dryRun) {
      console.log(JSON.stringify({ storyId: row.storyId, sceneCount: scenes.length }, null, 2));
      ok += 1;
      continue;
    }

    await prisma.storyStoryboard.upsert({
      where: { storyId: row.id },
      create: { storyId: row.id, scenes },
      update: { scenes },
    });

    await prisma.story.update({ where: { id: row.id }, data: { status: "STORYBOARDED" } });
    ok += 1;
  }

  await appendStoryUniverseChangelog(`generate-storyboards: ok=${ok}`);
  return { ok };
}
