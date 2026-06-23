const MAX_WORDS = 600;
const MIN_PARAGRAPHS = 2;
const MAX_PARAGRAPHS = 3;

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function htmlToParagraphs(html: string): string[] {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  const fromPTags = withoutScripts.match(/<p[^>]*>[\s\S]*?<\/p>/gi);
  if (fromPTags?.length) {
    return fromPTags
      .map((p) => stripHtml(p))
      .filter((p) => p.length > 40);
  }
  const plain = stripHtml(withoutScripts);
  return plain
    .split(/(?<=[.!?])\s+/)
    .reduce<string[]>((acc, sentence) => {
      const last = acc[acc.length - 1];
      if (!last || last.split(/\s+/).length > 80) {
        acc.push(sentence);
      } else {
        acc[acc.length - 1] = `${last} ${sentence}`;
      }
      return acc;
    }, [])
    .filter((p) => p.length > 40);
}

export function buildExcerptHtml(html: string): { excerptHtml: string; excerptPlain: string; wordCount: number } {
  const paragraphs = htmlToParagraphs(html);
  const selected: string[] = [];
  let wordCount = 0;

  for (const paragraph of paragraphs) {
    if (selected.length >= MAX_PARAGRAPHS) break;
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (selected.length < MIN_PARAGRAPHS || wordCount + words.length <= MAX_WORDS) {
      selected.push(paragraph);
      wordCount += words.length;
    }
  }

  if (!selected.length && paragraphs[0]) {
    const words = paragraphs[0].split(/\s+/).slice(0, MAX_WORDS);
    selected.push(words.join(" "));
    wordCount = words.length;
  }

  const excerptHtml = selected.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
  const excerptPlain = selected.join(" ");
  return { excerptHtml, excerptPlain, wordCount };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function truncateSummary(text: string, maxLen = 320): string {
  const plain = stripHtml(text);
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen).trim()}…`;
}
