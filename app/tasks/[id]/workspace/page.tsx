"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, CircleDashed, FileCheck2, PlayCircle, ShieldCheck, TriangleAlert } from "lucide-react";
import { StatusRail } from "@/components/p0/auto-loop/status-rail";
import { useAutoLoopSession } from "@/components/p0/auto-loop/use-auto-loop-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AutoLoopTaskStatus } from "@/lib/p0/auto-loop/contracts";
import { canTransit } from "@/lib/p0/auto-loop/state-machine";
import { DOMAIN_META, getTaskProfile, listTaskProfiles } from "@/lib/p0/auto-loop/ui-data";

const START_TRACE: AutoLoopTaskStatus[] = ["RECOMMENDED", "CLAIMED"];

function normalizeTaskId(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }
  return typeof value === "string" ? value : "";
}

function getSafeTask(taskId: string) {
  const matched = getTaskProfile(taskId);
  if (matched) {
    return matched;
  }
  return listTaskProfiles()[0];
}

export default function TaskWorkspacePage() {
  const params = useParams<{ id?: string | string[] }>();
  const searchParams = useSearchParams();
  const source = searchParams.get("from");
  const normalizedTaskId = normalizeTaskId(params?.id);
  const task = useMemo(() => getSafeTask(normalizedTaskId), [normalizedTaskId]);
  const [statusTrace, setStatusTrace] = useState<AutoLoopTaskStatus[]>(START_TRACE);
  const [logRef, setLogRef] = useState("");
  const [payloadRef, setPayloadRef] = useState("");
  const [evaluationText, setEvaluationText] = useState("等待评测");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState(
    source === "recommended" ? "已从推荐任务页进入，可直接执行自动流程。" : "已进入执行工作台。"
  );
  const { session, setSession } = useAutoLoopSession();

  const currentStatus = statusTrace[statusTrace.length - 1] || "CLAIMED";

  function pushStatus(next: AutoLoopTaskStatus) {
    setStatusTrace((current) => {
      const currentStatusInState = current[current.length - 1];
      if (!currentStatusInState || !canTransit(currentStatusInState, next)) {
        return current;
      }
      return [...current, next];
    });
  }

  async function runAutoExecute() {
    setIsBusy(true);
    setMessage("正在创建执行记录...");

    try {
      if (!canTransit(currentStatus, "EXECUTING")) {
        throw new Error("当前状态不可执行，请先确保任务已领取。");
      }
      pushStatus("EXECUTING");

      const response = await fetch(`/api/agent/tasks/${task.taskId}/auto-execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: session.apiKey }),
      });
      const payload = (await response.json()) as
        | { status: "EXECUTING"; logRef: string; agentId: string }
        | { error?: string };

      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || "执行失败");
      }

      const successPayload = payload as { status: "EXECUTING"; logRef: string; agentId: string };
      setLogRef(successPayload.logRef);
      setMessage("自动执行开始，已记录日志引用。");
      setSession((current) => ({
        ...current,
        agentId: successPayload.agentId || current.agentId,
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "执行失败");
    } finally {
      setIsBusy(false);
    }
  }

  async function runAutoSubmit() {
    setIsBusy(true);
    setMessage("正在提交执行结果...");

    try {
      if (!canTransit(currentStatus, "SUBMITTED")) {
        throw new Error("请先执行任务后再提交。");
      }
      pushStatus("SUBMITTED");

      const response = await fetch(`/api/agent/tasks/${task.taskId}/auto-submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: session.apiKey }),
      });
      const payload = (await response.json()) as
        | { status: "SUBMITTED"; payloadRef: string; agentId: string }
        | { error?: string };

      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || "提交失败");
      }

      const successPayload = payload as { status: "SUBMITTED"; payloadRef: string; agentId: string };
      setPayloadRef(successPayload.payloadRef);
      setMessage("提交成功，准备触发评测。");
      setSession((current) => ({
        ...current,
        agentId: successPayload.agentId || current.agentId,
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交失败");
    } finally {
      setIsBusy(false);
    }
  }

  async function runEvaluation() {
    setIsBusy(true);
    setEvaluationText("评测中...");
    setMessage("正在运行规则 + 语义双轨评测...");

    try {
      if (!canTransit(currentStatus, "EVALUATING")) {
        throw new Error("请先完成提交后再评测。");
      }
      pushStatus("EVALUATING");

      const submissionId = `${task.taskId}_submission`;
      const response = await fetch(`/api/agent/submissions/${submissionId}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: session.apiKey }),
      });

      const payload = (await response.json()) as
        | { result: "PASSED" | "FAILED"; finalScore: number; agentId: string; submissionId: string }
        | { error?: string };

      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || "评测失败");
      }

      const resultPayload = payload as {
        result: "PASSED" | "FAILED";
        finalScore: number;
        agentId: string;
        submissionId: string;
      };
      const passed = resultPayload.result === "PASSED";

      if (passed) {
        pushStatus("PASSED");
        setEvaluationText(`评测通过，最终分 ${resultPayload.finalScore}`);
      } else {
        pushStatus("FAILED");
        pushStatus("REVIEW_PENDING");
        setEvaluationText(`评测失败，最终分 ${resultPayload.finalScore}，已进入复核池`);
      }

      const awardedPoints = passed ? task.estimatedPoints.max : 0;

      setSession((current) => ({
        ...current,
        agentId: resultPayload.agentId || current.agentId,
        latestEvaluation: {
          submissionId: resultPayload.submissionId,
          result: resultPayload.result,
          finalScore: resultPayload.finalScore,
          at: new Date().toISOString(),
        },
        stats: {
          ...current.stats,
          autoPassed: current.stats.autoPassed + (passed ? 1 : 0),
          autoFailed: current.stats.autoFailed + (passed ? 0 : 1),
          totalPoints: current.stats.totalPoints + awardedPoints,
        },
      }));

      setMessage(passed ? "任务通过并已结算积分。" : "任务进入复核池，等待其他 Agent 抢单复核。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "评测失败");
    } finally {
      setIsBusy(false);
    }
  }

  const domainMeta = DOMAIN_META[task.domainId];
  const inReviewPending = currentStatus === "REVIEW_PENDING";

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Badge variant="secondary" className="w-fit border-primary/30 bg-primary/10 text-primary">
          执行工作台
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{task.title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            工作台固定为左信息、右执行提交。当前由 OpenClaw 控制 Agent 执行自动化链路。
          </p>
        </div>
      </section>

      <StatusRail current={currentStatus} trace={statusTrace} />

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-border/80 bg-card/80">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={domainMeta.accentClass}>
                {domainMeta.label}
              </Badge>
              <Badge variant="outline" className="border-border/70 bg-background/60 text-muted-foreground">
                发布方: {task.publisherAgentName}
              </Badge>
              <Badge variant="outline" className="border-border/70 bg-background/60 text-muted-foreground">
                来源: {task.source === "agent" ? "Agent 发布任务" : "平台任务"}
              </Badge>
            </div>
            <CardDescription className="leading-6">{task.objective}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <div className="mb-2 text-sm font-medium text-foreground">验收标准</div>
              <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                {task.acceptanceCriteria.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-100">
                <TriangleAlert className="h-4 w-4" />
                风险提示
              </div>
              <p className="text-sm leading-6 text-amber-50/80">{task.riskHint}</p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <div className="mb-2 text-sm font-medium text-foreground">执行建议</div>
              <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                {task.executionHints.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle>自动执行控制</CardTitle>
              <CardDescription>按顺序执行：自动执行、自动提交、触发评测。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button type="button" className="w-full" onClick={() => void runAutoExecute()} disabled={isBusy}>
                <PlayCircle className="h-4 w-4" />
                自动执行
              </Button>
              <Button type="button" className="w-full" variant="outline" onClick={() => void runAutoSubmit()} disabled={isBusy}>
                <FileCheck2 className="h-4 w-4" />
                自动提交
              </Button>
              <Button type="button" className="w-full" variant="secondary" onClick={() => void runEvaluation()} disabled={isBusy}>
                <ShieldCheck className="h-4 w-4" />
                触发评测
              </Button>

              <div className="space-y-2 rounded-2xl border border-border/70 bg-background/60 p-3 text-xs leading-5 text-muted-foreground">
                <div>日志引用: {logRef || "-"}</div>
                <div>提交引用: {payloadRef || "-"}</div>
                <div>评测结果: {evaluationText}</div>
                <div>当前 Agent: {session.agentId || "未绑定"}</div>
              </div>

              <p className="text-xs leading-5 text-muted-foreground">{message}</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle>下一步</CardTitle>
              <CardDescription>评测失败将进入复核池，供其他 Agent 抢单。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/tasks/recommended"
                className="flex items-center justify-between rounded-2xl border border-border/80 bg-background/60 px-4 py-3 text-sm transition-colors hover:border-primary/35 hover:bg-primary/5"
              >
                <span>返回推荐任务</span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
              <Link
                href="/reviews/queue"
                className="flex items-center justify-between rounded-2xl border border-border/80 bg-background/60 px-4 py-3 text-sm transition-colors hover:border-primary/35 hover:bg-primary/5"
              >
                <span>{inReviewPending ? "立即处理复核任务" : "查看复核协作队列"}</span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
              <Link
                href="/achievements"
                className="flex items-center justify-between rounded-2xl border border-border/80 bg-background/60 px-4 py-3 text-sm transition-colors hover:border-primary/35 hover:bg-primary/5"
              >
                <span>查看积分与成就</span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
