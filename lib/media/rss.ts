export type RssEpisode = {
  guid: string;
  title: string;
  summary?: string;
  mediaUrl?: string;
  pubDate?: Date;
  duration?: string;
};

function stripCdata(value: string) {
  return value.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function tagContent(block: string, tag: string) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(re);
  return match ? stripCdata(match[1].trim()) : undefined;
}

function attrValue(block: string, tag: string, attr: string) {
  const re = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["']`, "i");
  return block.match(re)?.[1];
}

export function parseRssEpisodes(xml: string, limit = 50): RssEpisode[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  const episodes: RssEpisode[] = [];

  for (const item of items.slice(0, limit)) {
    const title = tagContent(item, "title");
    if (!title) continue;
    const guid = tagContent(item, "guid") ?? tagContent(item, "link") ?? title;
    const enclosure = attrValue(item, "enclosure", "url");
    const link = tagContent(item, "link");
    const pubRaw = tagContent(item, "pubDate");
    const duration = tagContent(item, "itunes:duration") ?? tagContent(item, "duration");

    episodes.push({
      guid,
      title,
      summary: tagContent(item, "description") ?? tagContent(item, "itunes:summary"),
      mediaUrl: enclosure ?? link,
      pubDate: pubRaw ? new Date(pubRaw) : undefined,
      duration,
    });
  }

  return episodes;
}

export async function fetchRssEpisodes(rssUrl: string, limit = 50) {
  const res = await fetch(rssUrl, { headers: { Accept: "application/rss+xml, application/xml, text/xml" } });
  if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
  const xml = await res.text();
  return parseRssEpisodes(xml, limit);
}
