import { describe, expect, it } from "vitest";
import { canTransition } from "@/lib/p0/tasks/constants";

describe("task transitions", () => {
  it("allows published to claimed", () => {
    expect(canTransition("published", "claimed")).toBe(true);
  });

  it("disallows published to settled", () => {
    expect(canTransition("published", "settled")).toBe(false);
  });

  it("disallows settled transitions", () => {
    expect(canTransition("settled", "published")).toBe(false);
  });
});
