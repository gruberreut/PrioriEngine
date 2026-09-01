import { describe, expect, it } from "vitest";
import { contrastRatio } from "./useTokenValue";

describe("contrastRatio", () => {
  it("returns 21:1 for black on white", () => {
    expect(contrastRatio("rgb(0, 0, 0)", "rgb(255, 255, 255)")).toBeCloseTo(21, 0);
  });

  it("returns 1:1 for identical colors", () => {
    expect(contrastRatio("rgb(100, 100, 100)", "rgb(100, 100, 100)")).toBeCloseTo(1, 5);
  });

  it("is symmetric regardless of argument order", () => {
    const a = contrastRatio("rgb(251, 248, 243)", "rgb(158, 83, 80)");
    const b = contrastRatio("rgb(158, 83, 80)", "rgb(251, 248, 243)");
    expect(a).toBeCloseTo(b!, 5);
  });

  it("matches the hand-verified surface/accent pair from the migration plan", () => {
    expect(contrastRatio("rgb(251, 248, 243)", "rgb(158, 83, 80)")).toBeCloseTo(5.21, 1);
  });

  it("returns null for an unparseable color", () => {
    expect(contrastRatio("", "rgb(0, 0, 0)")).toBeNull();
  });
});
