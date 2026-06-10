import { describe, expect, it } from "vitest";
import { parseMediaUrl, resolvePlaybackUrl } from "@/lib/media/player";

describe("parseMediaUrl", () => {
  it("parses youtube watch url", () => {
    const parsed = parseMediaUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(parsed?.mode).toBe("iframe");
    expect(parsed?.src).toContain("youtube.com/embed/dQw4w9WgXcQ");
  });

  it("prefers playbackUrl over mediaUrl", () => {
    const parsed = resolvePlaybackUrl("https://youtube.com/watch?v=abc", "/uploads/event-videos/test.mp4");
    expect(parsed?.mode).toBe("video");
  });

  it("detects m3u8 as hls", () => {
    const parsed = parseMediaUrl("https://cdn.example.com/live/playlist.m3u8");
    expect(parsed?.mode).toBe("hls");
  });
});
