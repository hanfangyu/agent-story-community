import { afterEach, describe, expect, it, vi } from "vitest";
import { canTransition } from "@/lib/p0/tasks/constants";

const mocks = vi.hoisted(() => {
  const run = vi.fn();
  const prepare = vi.fn(() => ({ run }));
  const generateId = vi.fn(() => "task_test_0001");
  return { run, prepare, generateId };
});

vi.mock("@/lib/db/client", () => ({
  database: {
    prepare: mocks.prepare,
  },
  generateId: mocks.generateId,
}));

import { createTask } from "@/lib/p0/tasks/repository";

describe("task repository", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("allows published to claimed", () => {
    expect(canTransition("published", "claimed")).toBe(true);
  });

  it("disallows published to settled", () => {
    expect(canTransition("published", "settled")).toBe(false);
  });

  it("creates a published task with generated id", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-30T12:00:00.000Z"));
    mocks.run.mockResolvedValueOnce(undefined);

    const task = await createTask({
      domainId: "engineering-delivery",
      kind: "delivery",
      source: "agent",
      title: "Ship the onboarding fix",
      objective: "Reduce first-run friction",
      publisherAgentId: "agent_001",
      dueAt: "2026-04-01T00:00:00.000Z",
    });

    expect(mocks.generateId).toHaveBeenCalledWith("task");
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    expect(mocks.prepare.mock.calls[0][0]).toContain("INSERT INTO tasks");
    expect(mocks.prepare.mock.calls[0][0]).toContain("domain_id");
    expect(mocks.prepare.mock.calls[0][0]).toContain("kind");
    expect(mocks.prepare.mock.calls[0][0]).toContain("source");
    expect(mocks.prepare.mock.calls[0][0]).toContain("status");
    expect(mocks.prepare.mock.calls[0][0]).toContain("VALUES ($1, $2, $3, $4, 'published', $5, $6, $7, $8, $9, $10)");
    expect(mocks.run).toHaveBeenCalledWith(
      "task_test_0001",
      "engineering-delivery",
      "delivery",
      "agent",
      "Ship the onboarding fix",
      "Reduce first-run friction",
      "agent_001",
      "2026-04-01T00:00:00.000Z",
      "2026-03-30T12:00:00.000Z",
      "2026-03-30T12:00:00.000Z"
    );
    expect(mocks.run).toHaveBeenCalledTimes(1);
    expect(task).toEqual({
      id: "task_test_0001",
      domainId: "engineering-delivery",
      kind: "delivery",
      source: "agent",
      status: "published",
      title: "Ship the onboarding fix",
      objective: "Reduce first-run friction",
      publisherAgentId: "agent_001",
      dueAt: "2026-04-01T00:00:00.000Z",
      createdAt: "2026-03-30T12:00:00.000Z",
      updatedAt: "2026-03-30T12:00:00.000Z",
    });
  });
});
