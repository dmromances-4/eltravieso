import { readdir } from "fs/promises";
import path from "path";
import { createRequire } from "module";
import type { CorpusChunkManifest, CorpusManifest } from "../types";

const require = createRequire(import.meta.url);
const { EPub: EPubClass } = require("epub2") as { EPub: new (filePath: string) => EpubInstance };

type EpubInstance = {
  metadata: { title?: string; creator?: string };
  flow: Array<{ id: string; order?: number }>;
  on(event: string, cb: (...args: unknown[]) => void): void;
  parse(): void;
  getChapter(chapterId: string, callback: (err: Error | null, text?: string) => void): void;
};

const TARGET_WORDS_MIN = 600;
const TARGET_WORDS_MAX = 1200;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function chunkText(text: string, baseId: string): Array<{ chunkId: string; text: string; wordCount: number }> {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks: Array<{ chunkId: string; text: string; wordCount: number }> = [];
  let i = 0;
  let part = 0;

  while (i < words.length) {
    const slice = words.slice(i, i + TARGET_WORDS_MAX);
    const chunkWords = slice.length >= TARGET_WORDS_MIN || i + slice.length >= words.length
      ? slice
      : words.slice(i, i + TARGET_WORDS_MIN);
    const chunkTextValue = chunkWords.join(" ");
    chunks.push({
      chunkId: `${baseId}-part-${part}`,
      text: chunkTextValue,
      wordCount: chunkWords.length,
    });
    i += chunkWords.length;
    part += 1;
  }

  return chunks;
}

function parseEpub(filePath: string): Promise<EpubInstance> {
  return new Promise((resolve, reject) => {
    const epub = new EPubClass(filePath);
    epub.on("error", reject);
    epub.on("end", () => resolve(epub));
    epub.parse();
  });
}

function getChapterText(epub: EpubInstance, chapterId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    epub.getChapter(chapterId, (err, text) => {
      if (err) reject(err);
      else resolve(stripHtml(text ?? ""));
    });
  });
}

export type InMemoryChunk = CorpusChunkManifest & { text: string };

export async function ingestEpubDirectory(corpusPath: string): Promise<{
  manifest: CorpusManifest;
  chunks: InMemoryChunk[];
}> {
  const files = (await readdir(corpusPath)).filter((f) => f.toLowerCase().endsWith(".epub"));
  const allChunks: InMemoryChunk[] = [];
  const sources: CorpusManifest["sources"] = [];

  for (const file of files) {
    const filePath = path.join(corpusPath, file);
    const epub = await parseEpub(filePath);
    const title = epub.metadata.title ?? file.replace(/\.epub$/i, "");
    const author = epub.metadata.creator ?? "Unknown";

    const flow = Array.isArray(epub.flow) ? epub.flow : [];
    let chapterIndex = 0;
    for (const item of flow) {
      const chapterId = item.id;
      if (!chapterId) continue;
      const raw = await getChapterText(epub, chapterId);
      if (wordCount(raw) < 80) continue;

      const baseId = slugifyFile(file, chapterIndex);
      const parts = chunkText(raw, baseId);
      for (const part of parts) {
        allChunks.push({
          chunkId: part.chunkId,
          sourceFile: file,
          sourceTitle: title,
          sourceAuthor: author,
          chapterIndex,
          wordCount: part.wordCount,
          text: part.text,
        });
      }
      chapterIndex += 1;
    }

    sources.push({
      file,
      title,
      author,
      chunkCount: allChunks.filter((c) => c.sourceFile === file).length,
    });
  }

  const manifest: CorpusManifest = {
    generatedAt: new Date().toISOString(),
    corpusPath,
    sources,
    chunks: allChunks.map(({ text: _t, ...rest }) => rest),
  };

  return { manifest, chunks: allChunks };
}

function slugifyFile(file: string, chapterIndex: number): string {
  return file
    .replace(/\.epub$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .concat(`-ch-${chapterIndex}`);
}

/** Load manifest and optional temp chunk texts from cache dir (for re-analysis) */
export async function loadCachedChunkTexts(_cacheDir: string, _chunkId: string): Promise<string | null> {
  return null;
}
