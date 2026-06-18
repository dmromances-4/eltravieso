import prisma from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { appendStoryUniverseChangelog } from "../changelog";
import { UNIVERSE_EXPORT_PATH } from "../paths";

export async function exportStoryUniverseJson(): Promise<string> {
  await mkdir(path.dirname(UNIVERSE_EXPORT_PATH), { recursive: true });

  const [profiles, stories, scripts, storyboards, prompts] = await Promise.all([
    prisma.cocktailNarrativeProfile.findMany(),
    prisma.story.findMany({ orderBy: { storyId: "asc" } }),
    prisma.storyScript.findMany({ include: { story: { select: { storyId: true } } } }),
    prisma.storyStoryboard.findMany({ include: { story: { select: { storyId: true } } } }),
    prisma.storyAnimationPrompt.findMany({ include: { story: { select: { storyId: true } } } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    knowledgeVersion: process.env.STORY_KNOWLEDGE_VERSION ?? "1",
    cocktails: profiles,
    stories,
    scripts: scripts.map((s) => {
      const { story, storyId: _storyDbId, ...script } = s;
      return { storyId: story.storyId, ...script };
    }),
    storyboards: storyboards.map((b) => ({ storyId: b.story.storyId, scenes: b.scenes, story: undefined })),
    prompts: prompts.map((p) => ({
      storyId: p.story.storyId,
      sceneNumber: p.sceneNumber,
      prompts: p.prompts,
      story: undefined,
    })),
  };

  await writeFile(UNIVERSE_EXPORT_PATH, JSON.stringify(payload, null, 2), "utf8");
  await appendStoryUniverseChangelog(`export-story-universe → ${UNIVERSE_EXPORT_PATH}`);
  return UNIVERSE_EXPORT_PATH;
}
