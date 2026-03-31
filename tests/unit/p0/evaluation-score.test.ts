import { describe, expect, it } from "vitest";
import { computeFinalScore } from "@/lib/p0/evaluation/score";

describe("computeFinalScore", () => {
  it("computes weighted rounded score", () => {
    expect(
      computeFinalScore(
        { structure: 80, semantic: 90, compliance: 70 },
        { structure: 0.3, semantic: 0.5, compliance: 0.2 }
      )
    ).toBe(83);
  });

  it("throws when weights do not sum to 1", () => {
    expect(() =>
      computeFinalScore(
        { structure: 80, semantic: 90, compliance: 70 },
        { structure: 0.3, semantic: 0.4, compliance: 0.2 }
      )
    ).toThrow();
  });

  it("throws when scores or weights are not finite", () => {
    expect(() =>
      computeFinalScore(
        { structure: Number.NaN, semantic: 90, compliance: 70 },
        { structure: 0.3, semantic: 0.5, compliance: 0.2 }
      )
    ).toThrow();
  });
});
