import { describe, expect, it } from "vitest";

import { validateWritersCatalog } from "@/lib/blog/authors-catalog";
import { buildExcerptHtml, stripHtml } from "@/lib/blog/excerpt";
import { filterItemsSince, parseRssFeedItems } from "@/lib/blog/rss-feed";
import {
  parseDurationToSecs,
  youtubeEmbedUrl,
  youtubeVideoIdFromUrl,
} from "@/lib/blog/curated-slug";

describe("blog authors catalog", () => {
  it("has unique slugs and valid bios", () => {
    const errors = validateWritersCatalog();
    expect(errors).toEqual([]);
  });
});

describe("blog excerpt", () => {
  it("extracts first paragraphs up to word limit", () => {
    const html = `
      <p>Primer párrafo con suficiente texto para pasar el filtro mínimo de longitud.</p>
      <p>Segundo párrafo también con contenido editorial relevante para el lector.</p>
      <p>Tercer párrafo que debería quedar fuera si ya hay dos párrafos completos.</p>
    `;
    const { excerptHtml, wordCount } = buildExcerptHtml(html);
    expect(excerptHtml).toContain("Primer párrafo");
    expect(excerptHtml).toContain("Segundo párrafo");
    expect(wordCount).toBeGreaterThan(10);
    expect(wordCount).toBeLessThanOrEqual(600);
  });

  it("strips html tags", () => {
    expect(stripHtml("<p>Hola <strong>mundo</strong></p>")).toBe("Hola mundo");
  });
});

describe("blog rss feed", () => {
  it("parses item dates and filters since 2026", () => {
    const xml = `<?xml version="1.0"?>
      <rss><channel>
        <item>
          <title>Artículo 2026</title>
          <link>https://example.com/a</link>
          <pubDate>Mon, 15 Jun 2026 10:00:00 GMT</pubDate>
          <description><![CDATA[<p>Texto</p>]]></description>
        </item>
        <item>
          <title>Artículo 2024</title>
          <link>https://example.com/b</link>
          <pubDate>Mon, 15 Jun 2024 10:00:00 GMT</pubDate>
        </item>
      </channel></rss>`;
    const items = parseRssFeedItems(xml);
    const filtered = filterItemsSince(items, new Date("2026-01-01"));
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe("Artículo 2026");
  });
});

describe("blog curated helpers", () => {
  it("parses youtube video id", () => {
    expect(youtubeVideoIdFromUrl("https://www.youtube.com/watch?v=abc123XYZ_-")).toBe("abc123XYZ_-");
    expect(youtubeVideoIdFromUrl("https://youtu.be/abc123XYZ_-")).toBe("abc123XYZ_-");
    expect(youtubeEmbedUrl("abc123XYZ_-")).toContain("embed/abc123XYZ_-");
  });

  it("parses duration strings", () => {
    expect(parseDurationToSecs("1:05")).toBe(65);
    expect(parseDurationToSecs("3600")).toBe(3600);
  });
});
