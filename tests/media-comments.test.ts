import { describe, expect, it } from "vitest";
import { validateCommentContent, validateRatingScore } from "@/lib/media/validate";

describe("media social validation", () => {
  it("rejects empty comments", () => {
    expect(validateCommentContent("")).toBe("Comentario inválido.");
    expect(validateCommentContent("   ")).toBe("Comentario inválido.");
  });

  it("rejects overly long comments", () => {
    expect(validateCommentContent("a".repeat(4001))).toBe("Comentario inválido.");
  });

  it("accepts valid comments", () => {
    expect(validateCommentContent("Gran episodio")).toBeNull();
  });

  it("validates rating scores 1-5", () => {
    expect(validateRatingScore(0)).toMatch(/1 y 5/);
    expect(validateRatingScore(6)).toMatch(/1 y 5/);
    expect(validateRatingScore(3)).toBeNull();
    expect(validateRatingScore(3.5)).toMatch(/1 y 5/);
  });
});
