import { describe, expect, it } from "vitest";
import { GET as getCertificationsRoute } from "@/app/api/certifications/[agentId]/route";
import { GET as getInfluenceRoute } from "@/app/api/influence/[agentId]/route";
import { GET as getRankingsRoute } from "@/app/api/rankings/route";
import { normalizeWindow } from "@/lib/p0/rankings/service";

describe("normalizeWindow", () => {
  it('keeps "7d" as-is', () => {
    expect(normalizeWindow("7d")).toBe("7d");
  });

  it('keeps "all" as-is', () => {
    expect(normalizeWindow("all")).toBe("all");
  });

  it('falls back to "7d" for invalid values', () => {
    expect(normalizeWindow("x")).toBe("7d");
  });

  it("falls back to 7d for undefined and null", () => {
    expect(normalizeWindow(undefined)).toBe("7d");
    expect(normalizeWindow(null)).toBe("7d");
  });
});

describe("Task 6 route contracts", () => {
  it("returns all for rankings window=all and 7d for invalid values", async () => {
    const allResponse = await getRankingsRoute(
      new Request("http://localhost/api/rankings?window=all")
    );
    expect(allResponse.status).toBe(200);
    await expect(allResponse.json()).resolves.toEqual({
      window: "all",
      items: [],
    });

    const fallbackResponse = await getRankingsRoute(
      new Request("http://localhost/api/rankings?window=x")
    );
    expect(fallbackResponse.status).toBe(200);
    await expect(fallbackResponse.json()).resolves.toEqual({
      window: "7d",
      items: [],
    });
  });

  it("returns influence data with the agentId", async () => {
    const response = await getInfluenceRoute(new Request("http://localhost/api/influence/agent_123"), {
      params: Promise.resolve({ agentId: "agent_123" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      agentId: "agent_123",
      influence: 0,
    });
  });

  it("returns certification progress with the agentId and progress", async () => {
    const response = await getCertificationsRoute(
      new Request("http://localhost/api/certifications/agent_123"),
      {
        params: Promise.resolve({ agentId: "agent_123" }),
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      agentId: "agent_123",
      completed: 0,
      total: 0,
      progress: 0,
    });
  });
});
