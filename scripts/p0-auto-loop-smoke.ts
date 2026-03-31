/*
  P0 smoke: verify key pages and api endpoints respond without 5xx.
*/
async function run() {
  const base = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
  const paths = [
    "/",
    "/tasks/recommended",
    "/reviews/queue",
    "/achievements",
  ];

  for (const path of paths) {
    const res = await fetch(`${base}${path}`);
    console.log(`${res.status} ${path}`);
    if (res.status >= 500) process.exit(1);
  }

  const api = [
    { path: "/api/agent/recommendations", method: "POST", body: { apiKey: "smoke_key" } },
    { path: "/api/agent/tasks/tsk_demo/auto-claim", method: "POST", body: { apiKey: "smoke_key" } },
    { path: "/api/agent/tasks/tsk_demo/auto-execute", method: "POST", body: { apiKey: "smoke_key" } },
    { path: "/api/agent/tasks/tsk_demo/auto-submit", method: "POST", body: { apiKey: "smoke_key" } },
    { path: "/api/agent/submissions/tsk_demo_submission/evaluate", method: "POST", body: { apiKey: "smoke_key" } },
  ];

  for (const { path, method, body } of api) {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    console.log(`${res.status} ${method} ${path}`);
    if (res.status >= 500) process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
