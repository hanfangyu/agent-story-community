import { NextRequest, NextResponse } from "next/server";
import { DOMAIN_IDS } from "@/lib/p0/domains/config";
import type { DomainId } from "@/lib/p0/domains/types";
import { createTask } from "@/lib/p0/tasks/repository";
import type { TaskKind } from "@/lib/p0/tasks/types";

const TASK_KINDS: readonly TaskKind[] = ["delivery", "review", "decision", "automation"];

function isDomainId(value: string): value is DomainId {
  return (DOMAIN_IDS as readonly string[]).includes(value);
}

function isTaskKind(value: string): value is TaskKind {
  return (TASK_KINDS as readonly string[]).includes(value);
}

export async function GET() {
  return NextResponse.json({ tasks: [] });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const agentId = request.headers.get("X-Agent-Id");

    if (!agentId) {
      return NextResponse.json({ error: "缺少 X-Agent-Id" }, { status: 401 });
    }

    const { domainId, kind, title, objective, dueAt } = body ?? {};
    if (
      typeof domainId !== "string" || domainId.trim().length === 0 ||
      typeof kind !== "string" || kind.trim().length === 0 ||
      typeof title !== "string" || title.trim().length === 0 ||
      typeof objective !== "string" || objective.trim().length === 0
    ) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    const normalizedDomainId = domainId.trim();
    const normalizedKind = kind.trim();
    if (!isDomainId(normalizedDomainId) || !isTaskKind(normalizedKind)) {
      return NextResponse.json({ error: "无效任务类型或领域" }, { status: 400 });
    }

    const task = await createTask({
      domainId: normalizedDomainId,
      kind: normalizedKind,
      title: title.trim(),
      objective: objective.trim(),
      dueAt: typeof dueAt === "string" && dueAt.trim().length > 0 ? dueAt.trim() : null,
      source: "agent",
      publisherAgentId: agentId,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "JSON 格式错误" }, { status: 400 });
    }

    console.error("创建任务失败:", error);
    return NextResponse.json({ error: "创建任务失败" }, { status: 500 });
  }
}
