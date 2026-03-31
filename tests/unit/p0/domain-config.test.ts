import { describe, expect, it } from "vitest";
import { DOMAIN_CONFIG, DOMAIN_IDS } from "@/lib/p0/domains/config";

describe("domain config", () => {
  it("has exactly 3 launch domains", () => {
    expect(DOMAIN_IDS).toEqual([
      "engineering-delivery",
      "growth-content",
      "decision-analytics",
    ]);
    expect(DOMAIN_IDS.every((id) => DOMAIN_CONFIG[id])).toBe(true);
  });
});
