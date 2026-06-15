import { mkdir, readFile, readdir, writeFile } from "fs/promises";
import path from "path";
import { appendStoryUniverseChangelog } from "../changelog";
import {
  CORPUS_MANIFEST_PATH,
  getCorpusPath,
  getStoryAiThrottleMs,
  KNOWLEDGE_BASE_DIR,
  RAW_EXTRACTIONS_DIR,
} from "../paths";
import { analyzeChunk } from "./analyze-chunk";
import { ingestEpubDirectory, type InMemoryChunk } from "./ingest-epub";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export type IngestOptions = {
  corpusPath?: string;
  limit?: number;
  dryRun?: boolean;
  skipAnalyze?: boolean;
  useAi?: boolean;
};

export type IngestResult = {
  manifestPath: string;
  chunksTotal: number;
  analyzed: number;
  rejected: number;
};

export async function runLiteraryCorpusIngest(opts: IngestOptions = {}): Promise<IngestResult> {
  const corpusPath = opts.corpusPath ?? getCorpusPath();
  await mkdir(KNOWLEDGE_BASE_DIR, { recursive: true });
  await mkdir(RAW_EXTRACTIONS_DIR, { recursive: true });

  const { manifest, chunks } = await ingestEpubDirectory(corpusPath);
  const toProcess = opts.limit ? chunks.slice(0, opts.limit) : chunks;

  if (!opts.dryRun) {
    await writeFile(CORPUS_MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
  }

  let analyzed = 0;
  let rejected = 0;
  const throttle = getStoryAiThrottleMs();

  if (!opts.skipAnalyze) {
    for (const chunk of toProcess) {
      const { extraction, legal } = await analyzeChunk({
        chunkId: chunk.chunkId,
        sourceTitle: chunk.sourceTitle,
        sourceAuthor: chunk.sourceAuthor,
        text: chunk.text,
        useAi: opts.useAi,
      });

      if (!opts.dryRun) {
        const outPath = path.join(RAW_EXTRACTIONS_DIR, `${chunk.chunkId}.json`);
        await writeFile(
          outPath,
          JSON.stringify({ extraction, legal, analyzedAt: new Date().toISOString() }, null, 2),
          "utf8",
        );
      }

      if (legal.passed) analyzed += 1;
      else rejected += 1;

      if (throttle > 0) await sleep(throttle);
    }
  }

  await appendStoryUniverseChangelog(
    `ingest-literary-corpus: ${manifest.sources.length} EPUBs, ${toProcess.length} chunks, analyzed=${analyzed}, rejected=${rejected}`,
  );

  return {
    manifestPath: CORPUS_MANIFEST_PATH,
    chunksTotal: toProcess.length,
    analyzed,
    rejected,
  };
}

export async function loadRawExtractions(): Promise<
  Array<{ extraction: import("../types").ChunkExtraction; chunkId: string }>
> {
  let files: string[];
  try {
    files = (await readdir(RAW_EXTRACTIONS_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }

  const out: Array<{ extraction: import("../types").ChunkExtraction; chunkId: string }> = [];
  for (const file of files) {
    const raw = JSON.parse(await readFile(path.join(RAW_EXTRACTIONS_DIR, file), "utf8")) as {
      extraction: import("../types").ChunkExtraction;
      legal?: { passed: boolean };
    };
    if (raw.legal?.passed === false) continue;
    out.push({ extraction: raw.extraction, chunkId: raw.extraction.chunkId });
  }
  return out;
}

export type { InMemoryChunk };
