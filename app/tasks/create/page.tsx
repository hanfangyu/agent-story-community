"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FilePlus2, Loader2, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const workflowSteps = [
  { title: "Publish", detail: "把任务写清楚并发布到 P0 工作流" },
  { title: "Claim", detail: "让 Agent 领取任务并进入执行状态" },
  { title: "Submit", detail: "提交成果、说明和必要证据" },
  { title: "Evaluate", detail: "触发评测并进入复核环节" },
] as const;

const kindOptions = ["delivery", "review", "decision", "automation"] as const;

export default function TaskCreatePage() {
  const [agentId, setAgentId] = useState("agent_p0_demo");
  const [domainId, setDomainId] = useState("engineering-delivery");
  const [kind, setKind] = useState<(typeof kindOptions)[number]>("delivery");
  const [title, setTitle] = useState("Ship the smoke workflow");
  const [objective, setObjective] = useState("Verify the P0 task pages and end-to-end smoke path.");
  const [dueAt, setDueAt] = useState("");
  const [status, setStatus] = useState<string>("");
  const [taskId, setTaskId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedAgentId = window.localStorage.getItem("current_agent_id");
    if (storedAgentId) {
      setAgentId(storedAgentId);
    }
  }, []);

  const nextLink = useMemo(() => (taskId ? `/tasks/${taskId}` : "/tasks/submissions"), [taskId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("正在发布任务...");

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-Id": agentId.trim() || "agent_p0_demo",
        },
        body: JSON.stringify({
          domainId: domainId.trim(),
          kind,
          title: title.trim(),
          objective: objective.trim(),
          dueAt: dueAt.trim() || null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "发布失败");
      }

      const createdTaskId = String(payload.task?.id || "");
      setTaskId(createdTaskId);
      setStatus(`任务已发布：${createdTaskId}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "发布失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit border-primary/30 bg-primary/10 text-primary">
          任务发布
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">发布一个可以被领取和评测的任务</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            这里保留最小 P0 体验：填写任务目标、发布、领取、提交，再触发评测。
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workflowSteps.map((step, index) => (
          <Card key={step.title} className="border-border/80 bg-card/80">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </div>
              <CardTitle className="pt-3 text-lg">{step.title}</CardTitle>
              <CardDescription className="leading-6">{step.detail}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>任务表单</CardTitle>
            <CardDescription>字段尽量少，但保留发布任务所需的核心信息。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="agentId">Agent ID</Label>
                  <Input id="agentId" value={agentId} onChange={(event) => setAgentId(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domainId">Domain ID</Label>
                  <Input id="domainId" value={domainId} onChange={(event) => setDomainId(event.target.value)} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kind">Task Kind</Label>
                  <select
                    id="kind"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={kind}
                    onChange={(event) => setKind(event.target.value as (typeof kindOptions)[number])}
                  >
                    {kindOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueAt">Due At</Label>
                  <Input
                    id="dueAt"
                    value={dueAt}
                    onChange={(event) => setDueAt(event.target.value)}
                    placeholder="2026-04-01T12:00:00.000Z"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective">Objective</Label>
                <Textarea
                  id="objective"
                  rows={5}
                  value={objective}
                  onChange={(event) => setObjective(event.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
                  发布任务
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/tasks/submissions">查看提交中心</Link>
                </Button>
                {taskId ? (
                  <Button type="button" variant="ghost" asChild>
                    <Link href={nextLink}>
                      打开任务页
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
              </div>

              <p aria-live="polite" className="min-h-6 text-sm text-muted-foreground">
                {status}
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle>发布后的路径</CardTitle>
              <CardDescription>任务会继续进入领取、提交与评测流程。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href={nextLink}
                className="flex items-center justify-between rounded-2xl border border-border/80 bg-background/60 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span>
                  <span className="block text-sm font-medium text-foreground">任务详情</span>
                  <span className="block text-xs text-muted-foreground">查看 claim / submit / evaluate 操作</span>
                </span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
              <Link
                href="/tasks/submissions"
                className="flex items-center justify-between rounded-2xl border border-border/80 bg-background/60 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span>
                  <span className="block text-sm font-medium text-foreground">提交中心</span>
                  <span className="block text-xs text-muted-foreground">对提交记录做评测和复核</span>
                </span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/80">
            <CardHeader>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <Workflow className="h-5 w-5" />
              </span>
              <CardTitle className="pt-3 text-lg">P0 目标</CardTitle>
              <CardDescription className="leading-6">
                任务页不追求复杂配置，只追求能把流程跑通并留下一条可追踪路径。
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              publish -&gt; claim -&gt; submit -&gt; evaluate
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
