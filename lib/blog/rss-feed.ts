export type RssFeedItem = {
  guid: string;
  title: string;
  link?: string;
  summary?: string;
  contentHtml?: string;
  pubDate?: Date;
  enclosureUrl?: string;
  duration?: string;
  imageUrl?: string;
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

export function parseRssFeedItems(xml: string, limit = 50): RssFeedItem[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  const parsed: RssFeedItem[] = [];

  for (const item of items.slice(0, limit)) {
    const title = tagContent(item, "title");
    if (!title) continue;
    const guid = tagContent(item, "guid") ?? tagContent(item, "link") ?? title;
    const link = tagContent(item, "link");
    const pubRaw = tagContent(item, "pubDate") ?? tagContent(item, "published");
    const enclosure = attrValue(item, "enclosure", "url");
    const duration =
      tagContent(item, "itunes:duration") ??
      tagContent(item, "duration") ??
      attrValue(item, "itunes:duration", "value");
    const contentHtml =
      tagContent(item, "content:encoded") ??
      tagContent(item, "content") ??
      tagContent(item, "description");
    const summary = tagContent(item, "description") ?? tagContent(item, "itunes:summary");
    const imageUrl =
      attrValue(item, "media:thumbnail", "url") ??
      attrValue(item, "media:content", "url") ??
      tagContent(item, "itunes:image");

    parsed.push({
      guid,
      title,
      link,
      summary,
      contentHtml,
      pubDate: pubRaw ? new Date(pubRaw) : undefined,
      enclosureUrl: enclosure ?? link,
      duration,
      imageUrl,
    });
  }

  return parsed;
}

export async function fetchRssFeedItems(rssUrl: string, limit = 50): Promise<RssFeedItem[]> {
  const res = await fetch(rssUrl, {
    headers: { Accept: "application/rss+xml, application/xml, text/xml, */*" },
  });
  if (!res.ok) throw new Error(`RSS HTTP ${res.status} for ${rssUrl}`);
  const xml = await res.text();
  return parseRssFeedItems(xml, limit);
}

export function filterItemsSince(items: RssFeedItem[], since: Date): RssFeedItem[] {
  return items.filter((item) => {
    if (!item.pubDate || Number.isNaN(item.pubDate.getTime())) return false;
    return item.pubDate >= since;
  });
}
