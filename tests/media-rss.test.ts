import { describe, expect, it } from "vitest";
import { parseRssEpisodes } from "@/lib/media/rss";

const FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Podcast</title>
    <item>
      <title>Ep 1</title>
      <guid>guid-1</guid>
      <link>https://example.com/ep1</link>
      <enclosure url="https://cdn.example.com/ep1.mp3" type="audio/mpeg" />
    </item>
  </channel>
</rss>`;

describe("parseRssEpisodes", () => {
  it("extracts enclosure url and guid", () => {
    const eps = parseRssEpisodes(FIXTURE);
    expect(eps).toHaveLength(1);
    expect(eps[0].guid).toBe("guid-1");
    expect(eps[0].mediaUrl).toBe("https://cdn.example.com/ep1.mp3");
  });
});
