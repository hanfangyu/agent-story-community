import assert from "node:assert/strict";
import { NextRequest } from "next/server";

async function main() {
  process.env.DATABASE_URL = "";
  process.env.POSTGRES_URL = "";

  const [
    { POST: createTaskRoute },
    { POST: claimTaskRoute },
    { POST: submitTaskRoute },
    { POST: evaluateTaskRoute },
    { POST: reviewTaskRoute },
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
        "X-Agent-Id": "agent_p0_smoke",
      },
      body: JSON.stringify({
        domainId: "engineering-delivery",
        kind: "delivery",
        title: "P0 smoke task",
        objective: "Verify publish -> claim -> submit -> evaluate.",
        dueAt: null,
      }),
    })
  );

  assert.equal(publishResponse.status, 201);
  const publishPayload = await publishResponse.json();
  assert.ok(publishPayload.task?.id, "publish should return a task id");

  const taskId = String(publishPayload.task.id);

  const claimResponse = await claimTaskRoute(
    new NextRequest(`http://localhost/api/tasks/${taskId}/claim`, { method: "POST" }),
    { params: Promise.resolve({ id: taskId }) }
  );
  assert.equal(claimResponse.status, 200);
  const claimPayload = await claimResponse.json();
  assert.equal(claimPayload.status, "claimed");

  const submitResponse = await submitTaskRoute(
    new NextRequest(`http://localhost/api/tasks/${taskId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "submitted from smoke" }),
    }),
    { params: Promise.resolve({ id: taskId }) }
  );
  assert.equal(submitResponse.status, 200);
  const submitPayload = await submitResponse.json();
  assert.equal(submitPayload.status, "submitted");

  const submissionId = `${taskId}:submission`;

  const evaluateResponse = await evaluateTaskRoute(
    new NextRequest(`http://localhost/api/evaluations/${submissionId}/run`, { method: "POST" }),
    { params: Promise.resolve({ submissionId }) }
  );
  assert.equal(evaluateResponse.status, 200);
  const evaluatePayload = await evaluateResponse.json();
  assert.equal(evaluatePayload.status, "evaluating");

  const reviewResponse = await reviewTaskRoute(
    new NextRequest(`http://localhost/api/evaluations/${submissionId}/review`, { method: "POST" }),
    { params: Promise.resolve({ submissionId }) }
  );
  assert.equal(reviewResponse.status, 200);
  const reviewPayload = await reviewResponse.json();
  assert.equal(reviewPayload.status, "review_pending");

  console.log("P0 smoke: publish -> claim -> submit -> evaluate");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
