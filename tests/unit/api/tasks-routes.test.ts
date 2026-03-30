import { describe, expect, it, vi } from "vitest";
import { canTransition } from "@/lib/p0/tasks/constants";
import { createTask } from "@/lib/p0/tasks/repository";
import { GET as getTaskRoute } from "@/app/api/tasks/[id]/route";
import { POST as claimTaskRoute } from "@/app/api/tasks/[id]/claim/route";
import { POST as createTaskRoute } from "@/app/api/tasks/route";
import { POST as submitTaskRoute } from "@/app/api/tasks/[id]/submit/route";

vi.mock("@/lib/p0/tasks/repository", () => ({
  createTask: vi.fn(),
}));

describe("task api contracts", () => {
  it('allows published to claimed', () => {
    expect(canTransition("published", "claimed")).toBe(true);
  });

  it("rejects task creation without X-Agent-Id", async () => {
    const response = await createTaskRoute(
      new Request("http://localhost/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title: "Task" }),
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "缺少 X-Agent-Id" });
  });

  it("rejects malformed task JSON", async () => {
    const response = await createTaskRoute(
      new Request("http://localhost/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-Id": "agent_123",
        },
        body: "{",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "JSON 格式错误" });
  });

  it("rejects missing required task fields", async () => {
    const response = await createTaskRoute(
      new Request("http://localhost/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-Id": "agent_123",
        },
        body: JSON.stringify({
          domainId: "",
          kind: "delivery",
          title: "Ship it",
          objective: "Ship the task API",
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "缺少必填字段" });
  });

  it("creates a task from the agent header", async () => {
    const mockedCreateTask = vi.mocked(createTask);
    mockedCreateTask.mockResolvedValueOnce({
      id: "task_001",
      domainId: "engineering-delivery",
      kind: "delivery",
      source: "agent",
      status: "published",
      title: "Ship it",
      objective: "Ship the task API",
      publisherAgentId: "agent_123",
      dueAt: null,
      createdAt: "2026-03-30T00:00:00.000Z",
      updatedAt: "2026-03-30T00:00:00.000Z",
    });

    const response = await createTaskRoute(
      new Request("http://localhost/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-Id": "agent_123",
        },
        body: JSON.stringify({
          domainId: "engineering-delivery",
          kind: "delivery",
          title: "Ship it",
          objective: "Ship the task API",
          dueAt: null,
        }),
      })
    );

    expect(mockedCreateTask).toHaveBeenCalledWith({
      domainId: "engineering-delivery",
      kind: "delivery",
      title: "Ship it",
      objective: "Ship the task API",
      dueAt: null,
      source: "agent",
      publisherAgentId: "agent_123",
    });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      task: expect.objectContaining({
        id: "task_001",
        source: "agent",
        publisherAgentId: "agent_123",
      }),
    });
  });

  it("rejects empty task id on get", async () => {
    const response = await getTaskRoute(
      new Request("http://localhost/api/tasks//", { method: "GET" }),
      { params: Promise.resolve({ id: "" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "缺少 task id" });
  });

  it("rejects empty task id on claim", async () => {
    const response = await claimTaskRoute(
      new Request("http://localhost/api/tasks//claim", { method: "POST" }),
      { params: Promise.resolve({ id: "" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "缺少 task id" });
  });

  it("claims a task and returns task id", async () => {
    const response = await claimTaskRoute(
      new Request("http://localhost/api/tasks/task_001/claim", { method: "POST" }),
      { params: Promise.resolve({ id: "task_001" }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      status: "claimed",
      taskId: "task_001",
    });
  });

  it("rejects empty task id on submit", async () => {
    const response = await submitTaskRoute(
      new Request("http://localhost/api/tasks//submit", {
        method: "POST",
        body: JSON.stringify({ notes: "done" }),
      }),
      { params: Promise.resolve({ id: "" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "缺少 task id" });
  });

  it("submits a task and reports payload keys", async () => {
    const response = await submitTaskRoute(
      new Request("http://localhost/api/tasks/task_001/submit", {
        method: "POST",
        body: JSON.stringify({ notes: "done", attachments: [] }),
      }),
      { params: Promise.resolve({ id: "task_001" }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      status: "submitted",
      taskId: "task_001",
      payloadKeys: ["notes", "attachments"],
    });
  });
});
