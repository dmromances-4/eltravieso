import path from "path";

export const STORY_UNIVERSE_ROOT = path.join(process.cwd(), "lib/story-universe");
export const KNOWLEDGE_BASE_DIR = path.join(process.cwd(), "knowledge_base");
export const RAW_EXTRACTIONS_DIR = path.join(KNOWLEDGE_BASE_DIR, "raw_extractions");
export const CORPUS_MANIFEST_PATH = path.join(KNOWLEDGE_BASE_DIR, "corpus_manifest.json");
export const COCKTAIL_PROFILES_PATH = path.join(process.cwd(), "data/cocktail_profiles.json");
export const STORY_PROGRESS_PATH = path.join(process.cwd(), "data/.story-generation-progress.json");
export const UNIVERSE_EXPORT_PATH = path.join(process.cwd(), "data/exports/cocktail_universe.json");
export const CHANGELOG_PATH = path.join(process.cwd(), "docs/story-universe/07_changelog.md");

export function getCorpusPath(): string {
  return process.env.STORY_CORPUS_PATH?.trim() || path.join(process.cwd(), "corpus/epubs");
}

export function getStoryAiThrottleMs(): number {
  const raw = process.env.STORY_AI_THROTTLE_MS;
  const parsed = raw ? Number(raw) : 1500;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1500;
}

export function getMinOriginalityScore(): number {
  const raw = process.env.STORY_MIN_ORIGINALITY_SCORE;
  const parsed = raw ? Number(raw) : 0.85;
  return Number.isFinite(parsed) ? parsed : 0.85;
}
