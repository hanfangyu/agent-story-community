"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Search, ShieldCheck, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function TaskSubmissionsPage() {
  const [submissionId, setSubmissionId] = useState("task_p0_demo:submission");
  const [lookupStatus, setLookupStatus] = useState("等待查询");
  const [evaluateStatus, setEvaluateStatus] = useState("等待评测");
  const [isBusy, setIsBusy] = useState(false);

  const taskLink = useMemo(() => `/tasks/${submissionId.split(":")[0] || "task_p0_demo"}`, [submissionId]);

  async function lookupSubmission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setLookupStatus("正在查询...");

    try {
      const response = await fetch(`/api/evaluations/${submissionId}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "查询失败");
      setLookupStatus(`提交已就绪：${payload.submissionId}`);
    } catch (error) {
      setLookupStatus(error instanceof Error ? error.message : "查询失败");
    } finally {
      setIsBusy(false);
    }
  }

  async function evaluateSubmission() {
    setIsBusy(true);
    setEvaluateStatus("正在评测...");
    try {
      const runResponse = await fetch(`/api/evaluations/${submissionId}/run`, { method: "POST" });
      const runPayload = await runResponse.json();
      if (!runResponse.ok) throw new Error(runPayload?.error || "评测失败");

      const reviewResponse = await fetch(`/api/evaluations/${submissionId}/review`, { method: "POST" });
      const reviewPayload = await reviewResponse.json();
      if (!reviewResponse.ok) throw new Error(reviewPayload?.error || "复核失败");

      setEvaluateStatus(`评测流程完成：${runPayload.status} -> ${reviewPayload.status}`);
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
          提交中心
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">管理提交与评测入口</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            这个页面先提供一个最小可用的提交中心：输入 submission id，查询、评测并继续复核。
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <Workflow className="h-5 w-5" />
            </span>
            <CardTitle className="pt-3 text-lg">Lookup</CardTitle>
            <CardDescription className="leading-6">用 submission id 定位当前记录。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form className="space-y-3" onSubmit={lookupSubmission}>
              <Input value={submissionId} onChange={(event) => setSubmissionId(event.target.value)} />
              <Button type="submit" disabled={isBusy}>
                {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                查询提交
              </Button>
            </form>
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {lookupStatus}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80 md:col-span-2">
          <CardHeader>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <CardTitle className="pt-3 text-lg">Evaluate</CardTitle>
            <CardDescription className="leading-6">运行评测并进入复核阶段。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
              当前 submission id: <span className="text-foreground">{submissionId}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={evaluateSubmission} disabled={isBusy || !submissionId}>
                {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                运行评测
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={taskLink}>
                  返回任务页
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {evaluateStatus}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          { title: "Submitted", detail: "收集提交内容，确认 payload 可读。" },
          { title: "Evaluating", detail: "运行评测逻辑并产出初步结论。" },
          { title: "Review Pending", detail: "进入人工或规则复核。" },
        ].map((item) => (
          <Card key={item.title} className="border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription className="leading-6">{item.detail}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  );
}
