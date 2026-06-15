import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { CoverCandidate } from "@/lib/recipes/cover-discovery";

export type CoverManifestStrategy = "free_stock" | "ai_reference" | "ai_text" | "manual_import" | "queued";

export type CoverManifest = {
  slug: string;
  title: string;
  updatedAt: string;
  strategy?: CoverManifestStrategy;
  coverUrl?: string;
  referenceUrl?: string;
  attribution?: string;
  candidates?: CoverCandidate[];
  notes?: string;
};

const CACHE_DIR = path.join(process.cwd(), ".scrape-cache", "recipe-covers");

export function manifestPathForSlug(slug: string) {
  return path.join(CACHE_DIR, `${slug}.json`);
}

export async function readCoverManifest(slug: string): Promise<CoverManifest | null> {
  try {
    const raw = await readFile(manifestPathForSlug(slug), "utf-8");
    return JSON.parse(raw) as CoverManifest;
  } catch {
    return null;
  }
}

export async function writeCoverManifest(manifest: CoverManifest): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(manifestPathForSlug(manifest.slug), `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");
}
