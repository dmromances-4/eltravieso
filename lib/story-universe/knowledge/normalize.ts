import type { ChunkExtraction } from "../types";
import { slugifyId } from "../slugify";

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i]![0] = i;
  for (let j = 0; j <= n; j += 1) dp[0]![j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + cost);
    }
  }
  return dp[m]![n]!;
}

export function normalizeLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

export type AggregatedLabel = {
  label: string;
  id: string;
  count: number;
  sourceChunks: string[];
};

export function aggregateLabels(
  extractions: ChunkExtraction[],
  pick: (e: ChunkExtraction) => string[],
  similarityThreshold = 0.85,
): AggregatedLabel[] {
  const buckets: AggregatedLabel[] = [];

  for (const ext of extractions) {
    for (const raw of pick(ext)) {
      const label = raw.trim();
      if (!label) continue;
      const norm = normalizeLabel(label);

      let merged = false;
      for (const bucket of buckets) {
        const dist = levenshtein(norm, normalizeLabel(bucket.label));
        const maxLen = Math.max(norm.length, bucket.label.length);
        const sim = maxLen === 0 ? 1 : 1 - dist / maxLen;
        if (sim >= similarityThreshold || norm === normalizeLabel(bucket.label)) {
          bucket.count += 1;
          if (!bucket.sourceChunks.includes(ext.chunkId)) {
            bucket.sourceChunks.push(ext.chunkId);
          }
          merged = true;
          break;
        }
      }

      if (!merged) {
        buckets.push({
          label,
          id: slugifyId(label),
          count: 1,
          sourceChunks: [ext.chunkId],
        });
      }
    }
  }

  return buckets.sort((a, b) => b.count - a.count);
}

export function weightFromCount(count: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(1, Math.round((count / max) * 1000) / 1000);
}
