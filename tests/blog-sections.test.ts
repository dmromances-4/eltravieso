import { describe, expect, it } from "vitest";

import { sectionToKind } from "@/lib/blog/catalog";

describe("blog sections", () => {
  it("maps section to curated kind without pantalla kinds", () => {
    expect(sectionToKind("video")).toBe("VIDEO");
    expect(sectionToKind("podcast")).toBe("PODCAST");
    expect(sectionToKind("written")).toBeNull();
  });
});
