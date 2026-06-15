import prisma from "@/lib/prisma";
import { appendStoryUniverseChangelog } from "../changelog";
import { getStoryAiThrottleMs } from "../paths";
import { validateScriptRuntime } from "../qc/validate";
import type { StoryDraft } from "../types";
import { generateStoryScript } from "./generate-script";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runGenerateScripts(opts: {
  limit?: number;
  storyId?: string;
  dryRun?: boolean;
  useAi?: boolean;
}): Promise<{ ok: number; fail: number }> {
  const stories = await prisma.story.findMany({
    where: opts.storyId ? { storyId: opts.storyId } : { status: { in: ["QC_PASSED", "APPROVED"] } },
    include: { script: true },
    take: opts.limit ?? 50,
  });

  let ok = 0;
  let fail = 0;
  const throttle = getStoryAiThrottleMs();

  for (const row of stories) {
    if (row.script && !opts.storyId) continue;

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

    const script = await generateStoryScript(draft, opts.useAi);
    const qc = validateScriptRuntime(script.wordCount);

    if (opts.dryRun) {
      console.log(JSON.stringify({ storyId: row.storyId, script, qc }, null, 2));
      ok += 1;
      continue;
    }

    await prisma.storyScript.upsert({
      where: { storyId: row.id },
      create: {
        storyId: row.id,
        synopsis: script.synopsis,
        treatment: script.treatment,
        screenplay: script.screenplay,
        estimatedRuntimeMins: script.estimatedRuntimeMins,
        wordCount: script.wordCount,
      },
      update: {
        synopsis: script.synopsis,
        treatment: script.treatment,
        screenplay: script.screenplay,
        estimatedRuntimeMins: script.estimatedRuntimeMins,
        wordCount: script.wordCount,
      },
    });

    await prisma.story.update({
      where: { id: row.id },
      data: { status: qc.passed ? "SCRIPTED" : row.status },
    });

    if (qc.passed) ok += 1;
    else fail += 1;

    if (throttle > 0) await sleep(throttle);
  }

  await appendStoryUniverseChangelog(`generate-scripts: ok=${ok}, fail=${fail}`);
  return { ok, fail };
}
