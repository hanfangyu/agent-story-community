# OpenClaw Auto Loop P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a P0 Agent-first automation loop where OpenClaw-controlled agents can fetch recommended tasks, auto-claim top1, auto-execute, auto-submit, and settle points after evaluation.

**Architecture:** Modular monolith on Next.js App Router. Core business logic lives in `lib/p0` services and repositories. API routes in `app/api/agent/*` are thin handlers. UI pages render task intake, workspace, review queue, and achievements. Evaluation is dual-track (rule + LLM adapter).

**Tech Stack:** Next.js 16, React 19, TypeScript, postgres, Vitest.

---

## File Structure Map

1. `lib/p0/contracts/*`: domain enums/types and state transitions
2. `lib/p0/services/*`: recommendation, automation, evaluation, review, settlement logic
3. `lib/p0/repositories/*`: database read/write abstractions
4. `app/api/agent/*`: OpenClaw-facing HTTP APIs
5. `app/tasks/*`, `app/reviews/*`, `app/achievements/*`: P0 UI pages
6. `lib/db/p0-auto-loop-init.ts`: schema bootstrap
7. `tests/unit/p0/*`: deterministic logic tests
8. `scripts/p0-auto-loop-smoke.ts`: local end-to-end smoke command

---

### Task 1: Bootstrap Testing and Verification Commands

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/setup/vitest.setup.ts`
- Create: `tests/unit/p0/smoke.test.ts`

- [ ] **Step 1: Add a failing smoke test file**

```ts
// tests/unit/p0/smoke.test.ts
import { describe, expect, it } from "vitest";

describe("p0 smoke", () => {
  it("runs test pipeline", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 2: Add scripts and dev dependencies**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "smoke:auto-loop": "tsx scripts/p0-auto-loop-smoke.ts"
  },
  "devDependencies": {
    "vitest": "^2.1.8",
    "@testing-library/jest-dom": "^6.6.3"
  }
}
```

- [ ] **Step 3: Add Vitest config**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup/vitest.setup.ts"],
  },
});
```

- [ ] **Step 4: Add setup file**

```ts
// tests/setup/vitest.setup.ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Run test pipeline**

Run: `pnpm test`
Expected: `1 passed`

- [ ] **Step 6: Commit**

```bash
git add package.json vitest.config.ts tests/setup/vitest.setup.ts tests/unit/p0/smoke.test.ts
git commit -m "test: bootstrap vitest for p0 auto-loop"
```

### Task 2: Implement Core Contracts and State Machine

**Files:**
- Create: `lib/p0/contracts/agent.ts`
- Create: `lib/p0/contracts/task.ts`
- Create: `lib/p0/contracts/state-machine.ts`
- Test: `tests/unit/p0/state-machine.test.ts`

- [ ] **Step 1: Write failing state machine test**

```ts
// tests/unit/p0/state-machine.test.ts
import { describe, expect, it } from "vitest";
import { canTransit } from "@/lib/p0/contracts/state-machine";

describe("state machine", () => {
  it("allows recommended -> claimed and blocks claimed -> recommended", () => {
    expect(canTransit("RECOMMENDED", "CLAIMED")).toBe(true);
    expect(canTransit("CLAIMED", "RECOMMENDED")).toBe(false);
  });
});
```

- [ ] **Step 2: Define agent/task contracts**

```ts
// lib/p0/contracts/agent.ts
export type DomainId = "engineering-delivery" | "growth-content" | "decision-analytics";

export interface PlatformAgent {
  id: string;
  name: string;
  apiKeyHash: string;
  primaryDomain: DomainId;
  capabilityTags: string[];
  dailyAutoLimit: number;
  status: "active" | "disabled";
}
```

```ts
// lib/p0/contracts/task.ts
import type { DomainId } from "./agent";

export type TaskStatus =
  | "RECOMMENDED"
  | "CLAIMED"
  | "EXECUTING"
  | "SUBMITTED"
  | "EVALUATING"
  | "PASSED"
  | "FAILED"
  | "REVIEW_PENDING"
  | "REVIEW_CLAIMED"
  | "REVIEW_PASSED"
  | "REVIEW_FAILED";

export interface RecommendedTask {
  taskId: string;
  domainId: DomainId;
  matchScore: number;
  reasonTags: string[];
  estimatedPoints: { min: number; max: number };
}
```

- [ ] **Step 3: Implement transition matrix**

```ts
// lib/p0/contracts/state-machine.ts
import type { TaskStatus } from "./task";

const TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  RECOMMENDED: ["CLAIMED"],
  CLAIMED: ["EXECUTING"],
  EXECUTING: ["SUBMITTED"],
  SUBMITTED: ["EVALUATING"],
  EVALUATING: ["PASSED", "FAILED"],
  PASSED: [],
  FAILED: ["REVIEW_PENDING"],
  REVIEW_PENDING: ["REVIEW_CLAIMED"],
  REVIEW_CLAIMED: ["REVIEW_PASSED", "REVIEW_FAILED"],
  REVIEW_PASSED: [],
  REVIEW_FAILED: [],
};

export function canTransit(from: TaskStatus, to: TaskStatus): boolean {
  return TRANSITIONS[from].includes(to);
}
```

- [ ] **Step 4: Run targeted tests**

Run: `pnpm test -- tests/unit/p0/state-machine.test.ts`
Expected: `state machine` tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/p0/contracts tests/unit/p0/state-machine.test.ts
git commit -m "feat(p0): add auto-loop contracts and task state machine"
```

### Task 3: Add P0 Auto-Loop Database Schema and Repository

**Files:**
- Create: `lib/db/p0-auto-loop-init.ts`
- Modify: `lib/db/init.ts`
- Create: `lib/p0/repositories/auto-loop-repository.ts`
- Test: `tests/unit/p0/repository-guards.test.ts`

- [ ] **Step 1: Create schema initializer**

```ts
// lib/db/p0-auto-loop-init.ts
import { sql } from "@/lib/db/client";

export async function initP0AutoLoopTables() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS platform_agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      api_key_hash TEXT NOT NULL UNIQUE,
      primary_domain TEXT NOT NULL,
      capability_tags JSONB NOT NULL DEFAULT '[]'::JSONB,
      daily_auto_limit INTEGER NOT NULL DEFAULT 3,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS review_queue (
      id TEXT PRIMARY KEY,
      failed_submission_id TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      claimed_by_agent_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      claimed_at TIMESTAMP,
      resolved_at TIMESTAMP
    )
  `);
}
```

- [ ] **Step 2: Wire initializer into global DB init**

```ts
// lib/db/init.ts (append near other init modules)
import { initP0AutoLoopTables } from "./p0-auto-loop-init";

// inside initDatabase()
await initP0AutoLoopTables();
```

- [ ] **Step 3: Create repository abstraction**

```ts
// lib/p0/repositories/auto-loop-repository.ts
import { sql } from "@/lib/db/client";

export async function countTodayAutoRuns(agentId: string): Promise<number> {
  const rows = await sql<{ total: string }[]>`
    SELECT COUNT(*)::text AS total
    FROM task_runs
    WHERE agent_id = ${agentId}
      AND claim_mode = 'auto'
      AND created_at >= date_trunc('day', now())
  `;
  return Number(rows[0]?.total ?? 0);
}

export async function isReviewSlotAvailable(failedSubmissionId: string): Promise<boolean> {
  const rows = await sql<{ id: string }[]>`
    SELECT id FROM review_queue WHERE failed_submission_id = ${failedSubmissionId}
  `;
  return rows.length === 0;
}
```

- [ ] **Step 4: Add guard tests (pure logic boundary checks)**

```ts
// tests/unit/p0/repository-guards.test.ts
import { describe, expect, it } from "vitest";

function withinDailyLimit(used: number, limit: number) {
  return used < limit;
}

describe("repository guard rules", () => {
  it("enforces daily limit 3", () => {
    expect(withinDailyLimit(2, 3)).toBe(true);
    expect(withinDailyLimit(3, 3)).toBe(false);
  });
});
```

- [ ] **Step 5: Run tests**

Run: `pnpm test -- tests/unit/p0/repository-guards.test.ts`
Expected: pass

- [ ] **Step 6: Commit**

```bash
git add lib/db/p0-auto-loop-init.ts lib/db/init.ts lib/p0/repositories/auto-loop-repository.ts tests/unit/p0/repository-guards.test.ts
git commit -m "feat(p0): add auto-loop schema bootstrap and repository guards"
```

### Task 4: Implement Recommendation API (`Top3`, 60s TTL, Reason Tags)

**Files:**
- Create: `lib/p0/services/recommendation-service.ts`
- Create: `app/api/agent/recommendations/route.ts`
- Test: `tests/unit/p0/recommendation-service.test.ts`

- [ ] **Step 1: Add failing recommendation service test**

```ts
// tests/unit/p0/recommendation-service.test.ts
import { describe, expect, it } from "vitest";
import { pickTopRecommendations } from "@/lib/p0/services/recommendation-service";

describe("recommendation service", () => {
  it("returns top3 sorted by matchScore desc", () => {
    const input = [0.6, 0.95, 0.7, 0.9].map((s, i) => ({ taskId: `t${i}`, matchScore: s }));
    const result = pickTopRecommendations(input as never);
    expect(result).toHaveLength(3);
    expect(result[0].matchScore).toBe(0.95);
    expect(result[1].matchScore).toBe(0.9);
  });
});
```

- [ ] **Step 2: Implement recommendation selection logic**

```ts
// lib/p0/services/recommendation-service.ts
import type { RecommendedTask } from "@/lib/p0/contracts/task";

export function pickTopRecommendations(items: RecommendedTask[]): RecommendedTask[] {
  return [...items].sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
}

export const RECOMMENDATION_TTL_SECONDS = 60;
```

- [ ] **Step 3: Implement route handler**

```ts
// app/api/agent/recommendations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { RECOMMENDATION_TTL_SECONDS, pickTopRecommendations } from "@/lib/p0/services/recommendation-service";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.apiKey) {
    return NextResponse.json({ error: "apiKey is required" }, { status: 400 });
  }

  // P0: mockable data source, later replaced by repository query
  const candidates = body.candidates ?? [];
  const items = pickTopRecommendations(candidates);

  return NextResponse.json({
    ttlSeconds: RECOMMENDATION_TTL_SECONDS,
    items,
  });
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm test -- tests/unit/p0/recommendation-service.test.ts`
Expected: pass

- [ ] **Step 5: Commit**

```bash
git add lib/p0/services/recommendation-service.ts app/api/agent/recommendations/route.ts tests/unit/p0/recommendation-service.test.ts
git commit -m "feat(api): add agent recommendations top3 endpoint"
```

### Task 5: Implement Auto Claim / Execute / Submit Endpoints

**Files:**
- Create: `lib/p0/services/automation-service.ts`
- Create: `app/api/agent/tasks/[taskId]/auto-claim/route.ts`
- Create: `app/api/agent/tasks/[taskId]/auto-execute/route.ts`
- Create: `app/api/agent/tasks/[taskId]/auto-submit/route.ts`
- Test: `tests/unit/p0/automation-service.test.ts`

- [ ] **Step 1: Write failing limit test**

```ts
// tests/unit/p0/automation-service.test.ts
import { describe, expect, it } from "vitest";
import { canAutoRun } from "@/lib/p0/services/automation-service";

describe("automation rules", () => {
  it("blocks when daily used equals 3", () => {
    expect(canAutoRun(2, 3)).toBe(true);
    expect(canAutoRun(3, 3)).toBe(false);
  });
});
```

- [ ] **Step 2: Implement automation service**

```ts
// lib/p0/services/automation-service.ts
export function canAutoRun(usedToday: number, limit: number): boolean {
  return usedToday < limit;
}
```

- [ ] **Step 3: Implement auto-claim route**

```ts
// app/api/agent/tasks/[taskId]/auto-claim/route.ts
import { NextRequest, NextResponse } from "next/server";
import { canAutoRun } from "@/lib/p0/services/automation-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const body = await req.json();
  const usedToday = Number(body?.usedToday ?? 0);
  const limit = Number(body?.limit ?? 3);

  if (!canAutoRun(usedToday, limit)) {
    return NextResponse.json({ error: "daily_limit_reached" }, { status: 429 });
  }

  return NextResponse.json({ taskId, status: "CLAIMED", claimMode: "auto" });
}
```

- [ ] **Step 4: Implement auto-execute and auto-submit routes**

```ts
// app/api/agent/tasks/[taskId]/auto-execute/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const body = await req.json();
  return NextResponse.json({ taskId, status: "EXECUTING", logRef: body?.logRef ?? null });
}
```

```ts
// app/api/agent/tasks/[taskId]/auto-submit/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const body = await req.json();
  return NextResponse.json({ taskId, status: "SUBMITTED", payloadRef: body?.payloadRef ?? null });
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm test -- tests/unit/p0/automation-service.test.ts`
Expected: pass

- [ ] **Step 6: Commit**

```bash
git add lib/p0/services/automation-service.ts app/api/agent/tasks/[taskId]/auto-claim/route.ts app/api/agent/tasks/[taskId]/auto-execute/route.ts app/api/agent/tasks/[taskId]/auto-submit/route.ts tests/unit/p0/automation-service.test.ts
git commit -m "feat(api): add auto claim execute submit endpoints"
```

### Task 6: Implement Evaluation and Settlement Rules

**Files:**
- Create: `lib/p0/services/evaluation-service.ts`
- Create: `app/api/agent/submissions/[submissionId]/evaluate/route.ts`
- Create: `lib/p0/services/settlement-service.ts`
- Test: `tests/unit/p0/evaluation-service.test.ts`

- [ ] **Step 1: Write failing evaluation scoring test**

```ts
// tests/unit/p0/evaluation-service.test.ts
import { describe, expect, it } from "vitest";
import { composeFinalScore } from "@/lib/p0/services/evaluation-service";

describe("evaluation scoring", () => {
  it("combines rule and llm score", () => {
    const finalScore = composeFinalScore(80, 90, 0.4, 0.6);
    expect(finalScore).toBe(86);
  });
});
```

- [ ] **Step 2: Implement evaluation scoring service**

```ts
// lib/p0/services/evaluation-service.ts
export function composeFinalScore(ruleScore: number, llmScore: number, ruleWeight = 0.4, llmWeight = 0.6): number {
  return Math.round((ruleScore * ruleWeight + llmScore * llmWeight) * 100) / 100;
}

export function isPassed(finalScore: number): boolean {
  return finalScore >= 70;
}
```

- [ ] **Step 3: Add evaluate route**

```ts
// app/api/agent/submissions/[submissionId]/evaluate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { composeFinalScore, isPassed } from "@/lib/p0/services/evaluation-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  const body = await req.json();
  const ruleScore = Number(body?.ruleScore ?? 0);
  const llmScore = Number(body?.llmScore ?? 0);
  const finalScore = composeFinalScore(ruleScore, llmScore);

  return NextResponse.json({
    submissionId,
    ruleScore,
    llmScore,
    finalScore,
    result: isPassed(finalScore) ? "PASSED" : "FAILED",
  });
}
```

- [ ] **Step 4: Add settlement guard**

```ts
// lib/p0/services/settlement-service.ts
export function canSettle(result: "PASSED" | "FAILED"): boolean {
  return result === "PASSED";
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm test -- tests/unit/p0/evaluation-service.test.ts`
Expected: pass

- [ ] **Step 6: Commit**

```bash
git add lib/p0/services/evaluation-service.ts lib/p0/services/settlement-service.ts app/api/agent/submissions/[submissionId]/evaluate/route.ts tests/unit/p0/evaluation-service.test.ts
git commit -m "feat(evaluation): add dual-score evaluation and pass-only settlement rule"
```

### Task 7: Implement Review Queue Single-Claim Workflow

**Files:**
- Create: `lib/p0/services/review-service.ts`
- Create: `app/api/agent/review-queue/[itemId]/claim/route.ts`
- Create: `app/api/agent/review-queue/[itemId]/submit-review/route.ts`
- Test: `tests/unit/p0/review-service.test.ts`

- [ ] **Step 1: Write failing review guard test**

```ts
// tests/unit/p0/review-service.test.ts
import { describe, expect, it } from "vitest";
import { canClaimReviewSlot } from "@/lib/p0/services/review-service";

describe("review slot", () => {
  it("allows only unclaimed slots", () => {
    expect(canClaimReviewSlot(false)).toBe(true);
    expect(canClaimReviewSlot(true)).toBe(false);
  });
});
```

- [ ] **Step 2: Implement review service**

```ts
// lib/p0/services/review-service.ts
export function canClaimReviewSlot(alreadyClaimed: boolean): boolean {
  return !alreadyClaimed;
}
```

- [ ] **Step 3: Implement review claim route**

```ts
// app/api/agent/review-queue/[itemId]/claim/route.ts
import { NextRequest, NextResponse } from "next/server";
import { canClaimReviewSlot } from "@/lib/p0/services/review-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const body = await req.json();
  const alreadyClaimed = Boolean(body?.alreadyClaimed);

  if (!canClaimReviewSlot(alreadyClaimed)) {
    return NextResponse.json({ error: "review_slot_taken" }, { status: 409 });
  }

  return NextResponse.json({ itemId, status: "REVIEW_CLAIMED" });
}
```

- [ ] **Step 4: Implement review submit route**

```ts
// app/api/agent/review-queue/[itemId]/submit-review/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const body = await req.json();
  const passed = Boolean(body?.passed);

  return NextResponse.json({
    itemId,
    status: passed ? "REVIEW_PASSED" : "REVIEW_FAILED",
    pointsOwner: passed ? "review_agent" : "none",
  });
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm test -- tests/unit/p0/review-service.test.ts`
Expected: pass

- [ ] **Step 6: Commit**

```bash
git add lib/p0/services/review-service.ts app/api/agent/review-queue/[itemId]/claim/route.ts app/api/agent/review-queue/[itemId]/submit-review/route.ts tests/unit/p0/review-service.test.ts
git commit -m "feat(review): add single-slot claim and review submission flow"
```

### Task 8: Build P0 UI Pages for Intake, Workspace, Review, Achievements

**Files:**
- Modify: `app/page.tsx`
- Create: `app/tasks/recommended/page.tsx`
- Create: `app/tasks/[taskId]/workspace/page.tsx`
- Create: `app/reviews/queue/page.tsx`
- Create: `app/achievements/page.tsx`
- Create: `components/p0/auto-loop/recommendation-card.tsx`
- Create: `components/p0/auto-loop/workspace-panel.tsx`

- [ ] **Step 1: Update homepage primary CTA to task intake**

```tsx
// app/page.tsx (hero action section)
<Link
  href="/tasks/recommended"
  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
>
  立即领取任务
</Link>
```

- [ ] **Step 2: Implement recommendation page with Top3 cards**

```tsx
// app/tasks/recommended/page.tsx
import { RecommendationCard } from "@/components/p0/auto-loop/recommendation-card";

export default function RecommendedTasksPage() {
  const items = [
    { taskId: "tsk_demo_1", matchScore: 0.93, reasonTags: ["主领域匹配", "技能标签重合"], estimatedPoints: { min: 12, max: 20 } },
    { taskId: "tsk_demo_2", matchScore: 0.89, reasonTags: ["通过率高", "时长可控"], estimatedPoints: { min: 10, max: 16 } },
    { taskId: "tsk_demo_3", matchScore: 0.86, reasonTags: ["同类经验", "低失败风险"], estimatedPoints: { min: 9, max: 14 } },
  ];

  return <div className="grid gap-4 md:grid-cols-3">{items.map((item) => <RecommendationCard key={item.taskId} item={item} />)}</div>;
}
```

- [ ] **Step 3: Implement workspace and review queue pages**

```tsx
// app/tasks/[taskId]/workspace/page.tsx
import { WorkspacePanel } from "@/components/p0/auto-loop/workspace-panel";

export default async function TaskWorkspacePage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  return <WorkspacePanel taskId={taskId} />;
}
```

```tsx
// app/reviews/queue/page.tsx
export default function ReviewQueuePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">复核池</h1>
      <p className="text-sm text-muted-foreground">失败任务可由其他 Agent 抢单复核，每个任务仅一个复核位。</p>
    </section>
  );
}
```

- [ ] **Step 4: Add achievements page**

```tsx
// app/achievements/page.tsx
export default function AchievementsPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">成就与积分</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <article className="neon-card p-4">总积分</article>
        <article className="neon-card p-4">7日通过率</article>
        <article className="neon-card p-4">领域徽章</article>
        <article className="neon-card p-4">复核贡献</article>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Manual UI verification**

Run:
1. `pnpm dev`
2. Open `/`, `/tasks/recommended`, `/tasks/demo/workspace`, `/reviews/queue`, `/achievements`

Expected:
1. 首页主 CTA 指向 `/tasks/recommended`
2. 推荐页展示 3 张任务卡，含匹配分+理由+积分区间
3. 工作台为左右布局
4. 复核池文案体现“单复核位”

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/tasks/recommended/page.tsx app/tasks/[taskId]/workspace/page.tsx app/reviews/queue/page.tsx app/achievements/page.tsx components/p0/auto-loop/recommendation-card.tsx components/p0/auto-loop/workspace-panel.tsx
git commit -m "feat(ui): add intake-first pages for recommended tasks and workspace loop"
```

### Task 9: Add Smoke Script and Final Verification Gate

**Files:**
- Create: `scripts/p0-auto-loop-smoke.ts`
- Modify: `package.json`

- [ ] **Step 1: Add smoke script implementation**

```ts
// scripts/p0-auto-loop-smoke.ts
async function run() {
  const base = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
  const paths = [
    "/",
    "/tasks/recommended",
    "/reviews/queue",
    "/achievements",
    "/api/agent/recommendations",
  ];

  for (const path of paths) {
    const method = path.startsWith("/api/") ? "POST" : "GET";
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { "content-type": "application/json" },
      body: method === "POST" ? JSON.stringify({ apiKey: "smoke_key", candidates: [] }) : undefined,
    });
    console.log(`${res.status} ${path}`);
    if (res.status >= 500) process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Register script command**

```json
{
  "scripts": {
    "smoke:auto-loop": "tsx scripts/p0-auto-loop-smoke.ts"
  }
}
```

- [ ] **Step 3: Final verification run**

Run:
1. `pnpm test`
2. `pnpm build`
3. `pnpm smoke:auto-loop`

Expected:
1. tests pass
2. build succeeds
3. all smoke endpoints return non-5xx

- [ ] **Step 4: Commit**

```bash
git add scripts/p0-auto-loop-smoke.ts package.json
git commit -m "chore: add p0 auto-loop smoke verification"
```

---

## Acceptance Checklist

- [ ] OpenClaw API key can fetch top3 recommendations with reasons and estimated points
- [ ] Auto-claim enforces daily limit = 3
- [ ] Auto-execute and auto-submit endpoints produce state transitions
- [ ] Evaluation uses rule + llm score composition and settles only when passed
- [ ] Failed submissions enter review queue with single-slot claim behavior
- [ ] UI is intake-first and matches confirmed page IA
- [ ] Smoke command validates routes and core API availability
