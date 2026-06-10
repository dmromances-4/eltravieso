import { describe, expect, it } from "vitest";
import { validateLiveStreamInput, validateMediaForRole } from "@/lib/media/validate";

describe("validateMediaForRole", () => {
  it("allows admin any kind", () => {
    const err = validateMediaForRole("ADMIN", {
      title: "Casino Royale",
      kind: "FILM",
    });
    expect(err).toBeNull();
  });

  it("blocks bar owner from films", () => {
    const err = validateMediaForRole("BAR_OWNER", {
      title: "Evento",
      kind: "FILM",
      barProfileId: "bar-1",
    });
    expect(err).toContain("solo pueden publicar eventos");
  });

  it("requires bar profile for bar events", () => {
    const err = validateMediaForRole("BAR_OWNER", {
      title: "Cata",
      kind: "EVENT_VIDEO",
      mediaUrl: "https://youtube.com/watch?v=abc",
    });
    expect(err).toContain("perfil del bar");
  });
});

describe("validateLiveStreamInput", () => {
  it("requires embed url", () => {
    expect(validateLiveStreamInput({ title: "Golf", embedUrl: "" })).toContain("embed");
  });
});
