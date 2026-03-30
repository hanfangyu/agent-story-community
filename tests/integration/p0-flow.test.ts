import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createTask: vi.fn(async (input: any) => ({
    ...input,
    id: "task_integration_001",
    status: "published",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  })),
}));

vi.mock("@/lib/p0/tasks/repository", () => ({
  createTask: mocks.createTask,
}));

describe("p0 flow", () => {
  it("runs publish -> claim -> submit -> evaluate -> review", async () => {
    const [
      { POST: createTaskRoute },
      { POST: claimTaskRoute },
      { POST: submitTaskRoute },
      { POST: runEvaluationRoute },
      { POST: reviewEvaluationRoute },
    ] = await Promise.all([
      import("@/app/api/tasks/route"),
      import("@/app/api/tasks/[id]/claim/route"),
      import("@/app/api/tasks/[id]/submit/route"),
      import("@/app/api/evaluations/[submissionId]/run/route"),
      import("@/app/api/evaluations/[submissionId]/review/route"),
    ]);

    const publishResponse = await createTaskRoute(
      new NextRequest("http://localhost/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-Id": "agent_p0_test",
        },
        body: JSON.stringify({
          domainId: "engineering-delivery",
          kind: "delivery",
          title: "P0 integration test",
          objective: "Verify end-to-end contract flow.",
          dueAt: null,
        }),
      })
    );

    expect(publishResponse.status).toBe(201);
    const publishPayload = await publishResponse.json();
    const taskId = String(publishPayload.task?.id || "");
    expect(taskId).not.toBe("");
    expect(mocks.createTask).toHaveBeenCalledTimes(1);

    const claimResponse = await claimTaskRoute(
      new NextRequest(`http://localhost/api/tasks/${taskId}/claim`, { method: "POST" }),
      { params: Promise.resolve({ id: taskId }) }
    );
    expect(claimResponse.status).toBe(200);
    await expect(claimResponse.json()).resolves.toEqual({
      ok: true,
      status: "claimed",
      taskId,
    });

    const submitResponse = await submitTaskRoute(
      new NextRequest(`http://localhost/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "submitted by integration test" }),
      }),
      { params: Promise.resolve({ id: taskId }) }
    );
    expect(submitResponse.status).toBe(200);
    await expect(submitResponse.json()).resolves.toEqual({
      ok: true,
      status: "submitted",
      taskId,
      payloadKeys: ["notes"],
    });

    const submissionId = `${taskId}:submission`;

    const runResponse = await runEvaluationRoute(
      new NextRequest(`http://localhost/api/evaluations/${submissionId}/run`, { method: "POST" }),
      { params: Promise.resolve({ submissionId }) }
    );
    expect(runResponse.status).toBe(200);
    await expect(runResponse.json()).resolves.toEqual({
      ok: true,
      status: "evaluating",
      submissionId,
    });

    const reviewResponse = await reviewEvaluationRoute(
      new NextRequest(`http://localhost/api/evaluations/${submissionId}/review`, { method: "POST" }),
      { params: Promise.resolve({ submissionId }) }
    );
    expect(reviewResponse.status).toBe(200);
    await expect(reviewResponse.json()).resolves.toEqual({
      ok: true,
      status: "review_pending",
      submissionId,
    });
  });
});
