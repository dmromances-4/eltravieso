import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { CHANGELOG_PATH } from "./paths";

export async function appendStoryUniverseChangelog(entry: string): Promise<void> {
  const dir = path.dirname(CHANGELOG_PATH);
  await mkdir(dir, { recursive: true });
  const line = `- ${new Date().toISOString()} — ${entry}\n`;
  await appendFile(CHANGELOG_PATH, line, "utf8");
}
