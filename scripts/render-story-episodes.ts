#!/usr/bin/env tsx
/**
 * Render Story Universe episode previews with Remotion (text-card placeholder).
 *
 * Usage:
 *   npm run render:story-episodes -- --story-id STORY-0001
 *   npm run render:story-episodes -- --limit 1
 *   npm run render:story-episodes -- --dry-run
 */
import { config } from "dotenv";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { runRemotionRender } from "@/lib/remotion/exec-render";
import prisma from "@/lib/prisma";
import { storyboardToEpisodeProps } from "@/remotion/story-episode/StoryEpisode";
import { uploadStoryEpisodeBuffer } from "@/lib/storage/upload-image";

config({ path: ".env.local" });
config({ path: ".env" });

const OUT_DIR = path.join(process.cwd(), ".tmp-story-episodes");
const REMOTION_ENTRY = "remotion/story-episode/index.ts";

type SceneRow = {
  sceneNumber: number;
  description: string;
  durationSecs: number;
  camera: string;
  lighting: string;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    storyId: undefined as string | undefined,
    limit: 1,
    dryRun: false,
    force: false,
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === "--story-id") opts.storyId = args[++i];
    else if (a === "--limit") opts.limit = Number(args[++i]);
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--force") opts.force = true;
  }
  return opts;
}

async function renderEpisode(storyId: string, props: ReturnType<typeof storyboardToEpisodeProps>, outputPath: string) {
  const propsPath = path.join(OUT_DIR, `${storyId}-props.json`);
  await writeFile(propsPath, JSON.stringify(props));
  await runRemotionRender(REMOTION_ENTRY, "StoryEpisode", outputPath, propsPath);
}

async function main() {
  const opts = parseArgs();

  const stories = await prisma.story.findMany({
    where: opts.storyId ? { storyId: opts.storyId } : undefined,
    include: { storyboard: true },
    orderBy: { storyId: "asc" },
    take: opts.storyId ? 1 : opts.limit,
  });

  const targets = stories.filter((s) => s.storyboard?.scenes);
  if (!targets.length) {
    console.log("No stories with storyboard. Run generate:storyboards first.");
    return;
  }

  console.log(`🎬 Story episodes: ${targets.length} target(s)`);
  if (opts.dryRun) {
    for (const s of targets) console.log(`  [dry-run] ${s.storyId} — ${s.title}`);
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  let ok = 0;
  let fail = 0;

  for (const story of targets) {
    const scenes = story.storyboard!.scenes as SceneRow[];
    const props = storyboardToEpisodeProps({
      title: story.title,
      logline: story.logline,
      scenes,
    });

    const outputPath = path.join(OUT_DIR, `${story.storyId}.mp4`);
    console.log(`\n→ ${story.storyId}: ${story.title} (${props.totalFrames} frames, ${scenes.length} scenes)`);

    try {
      await renderEpisode(story.storyId, props, outputPath);
      const buffer = await readFile(outputPath);
      const videoUrl = await uploadStoryEpisodeBuffer(story.storyId, buffer);
      console.log(`  ✓ ${videoUrl}`);
      ok += 1;
    } catch (error) {
      console.error(`  ✗`, error instanceof Error ? error.message : error);
      fail += 1;
    }
  }

  await rm(OUT_DIR, { recursive: true, force: true }).catch(() => undefined);
  console.log(`\nDone: ${ok} ok, ${fail} failed`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
