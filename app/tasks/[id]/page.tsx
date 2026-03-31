"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, MessageSquareText, ShieldCheck, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function readTaskId(param: string | string[] | undefined) {
  if (Array.isArray(param)) return param[0] || "";
  return typeof param === "string" ? param : "";
}

function toSubmissionId(taskId: string) {
  return `${taskId.trim()}:submission`;
}

export default function TaskDetailPage() {
  const params = useParams<{ id?: string | string[] }>();
  const routeTaskId = readTaskId(params?.id);
  const [taskId, setTaskId] = useState(routeTaskId || "task_p0_demo");
  const [submissionId, setSubmissionId] = useState(() => `${routeTaskId || "task_p0_demo"}:submission`);
  const [notes, setNotes] = useState("I have completed the requested task and attached the result summary.");
  const [claimStatus, setClaimStatus] = useState("待领取");
  const [submitStatus, setSubmitStatus] = useState("待提交");
  const [evaluateStatus, setEvaluateStatus] = useState("待评测");
  const [isBusy, setIsBusy] = useState(false);
  const canEvaluate = submitStatus.startsWith("已提交") && submissionId === toSubmissionId(taskId);

  useEffect(() => {
    if (routeTaskId) {
      setTaskId(routeTaskId);
      setSubmissionId(toSubmissionId(routeTaskId));
    }
  }, [routeTaskId]);

  async function claimTask() {
    setIsBusy(true);
    setClaimStatus("正在领取...");
    try {
      const response = await fetch(`/api/tasks/${taskId}/claim`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "领取失败");
      setClaimStatus(`已领取：${payload.taskId}`);
    } catch (error) {
      setClaimStatus(error instanceof Error ? error.message : "领取失败");
    } finally {
      setIsBusy(false);
    }
  }

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setSubmitStatus("正在提交...");
    try {
      const response = await fetch(`/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "提交失败");
      const submittedTaskId = String(payload.taskId || taskId).trim();
      const nextSubmissionId = toSubmissionId(submittedTaskId);
      setTaskId(submittedTaskId);
      setSubmissionId(nextSubmissionId);
      setSubmitStatus(`已提交：${nextSubmissionId}`);
      setEvaluateStatus("可触发评测");
    } catch (error) {
      setSubmitStatus(error instanceof Error ? error.message : "提交失败");
    } finally {
      setIsBusy(false);
    }
  }

  async function evaluateTask() {
    if (!canEvaluate) {
      setEvaluateStatus("请先提交当前任务后再评测");
      return;
    }

    setIsBusy(true);
    setEvaluateStatus("正在评测...");
    try {
      const runResponse = await fetch(`/api/evaluations/${submissionId}/run`, { method: "POST" });
      const runPayload = await runResponse.json();
      if (!runResponse.ok) throw new Error(runPayload?.error || "评测失败");

      const reviewResponse = await fetch(`/api/evaluations/${submissionId}/review`, { method: "POST" });
      const reviewPayload = await reviewResponse.json();
      if (!reviewResponse.ok) throw new Error(reviewPayload?.error || "复核失败");

      setEvaluateStatus(`评测完成：${runPayload.status} -> ${reviewPayload.status}`);
    } catch (error) {
      setEvaluateStatus(error instanceof Error ? error.message : "评测失败");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit border-primary/30 bg-primary/10 text-primary">
          任务详情
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">任务 {taskId}</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            这是 P0 的最小任务页，直接把领取、提交和评测三个动作放在同一条工作流里。
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <Workflow className="h-5 w-5" />
            </span>
            <CardTitle className="pt-3 text-lg">Claim</CardTitle>
            <CardDescription className="leading-6">领取后任务进入执行态。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button type="button" onClick={claimTask} disabled={isBusy}>
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              领取任务
            </Button>
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {claimStatus}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80 md:col-span-2">
          <CardHeader>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <MessageSquareText className="h-5 w-5" />
            </span>
            <CardTitle className="pt-3 text-lg">Submit</CardTitle>
            <CardDescription className="leading-6">提交成果和说明，系统会进入后续评测。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submitTask}>
              <div className="space-y-2">
                <Label htmlFor="taskId">Task ID</Label>
                <Input
                  id="taskId"
                  value={taskId}
                  onChange={(event) => {
                    const nextTaskId = event.target.value;
                    setTaskId(nextTaskId);
                    setSubmissionId(toSubmissionId(nextTaskId));
                    setSubmitStatus("待提交");
                    setEvaluateStatus("待评测");
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Submission Notes</Label>
                <Textarea id="notes" rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={isBusy}>
                  {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  提交结果
                </Button>
                <Button type="button" variant="outline" onClick={evaluateTask} disabled={isBusy || !canEvaluate}>
                  <ShieldCheck className="h-4 w-4" />
                  触发评测
                </Button>
                <Button type="button" variant="ghost" asChild>
                  <Link href="/tasks/submissions">
                    打开提交中心
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <p aria-live="polite" className="text-sm text-muted-foreground">
                {submitStatus}
              </p>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Evaluate</CardTitle>
            <CardDescription>完成提交后，使用 submission id 把结果送进评测和复核。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
              当前 submission id: <span className="text-foreground">{submissionId}</span>
            </div>
            <Button type="button" onClick={evaluateTask} disabled={isBusy || !canEvaluate}>
              <CheckCircle2 className="h-4 w-4" />
              运行评测链路
            </Button>
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {evaluateStatus}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Workflow Links</CardTitle>
            <CardDescription>保持页面之间的跳转清晰，方便从发布到提交中心来回切换。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/tasks/create"
              className="flex items-center justify-between rounded-2xl border border-border/80 bg-background/60 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span>
                <span className="block text-sm font-medium text-foreground">返回发布页</span>
                <span className="block text-xs text-muted-foreground">继续创建新的任务</span>
              </span>
              <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
            <Link
              href="/tasks/submissions"
              className="flex items-center justify-between rounded-2xl border border-border/80 bg-background/60 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span>
                <span className="block text-sm font-medium text-foreground">提交中心</span>
                <span className="block text-xs text-muted-foreground">查看和复核提交记录</span>
              </span>
              <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
