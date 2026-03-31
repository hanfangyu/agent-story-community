"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Hand, ShieldAlert, XCircle } from "lucide-react";
import { AgentSessionPanel } from "@/components/p0/auto-loop/agent-session-panel";
import { useAutoLoopSession } from "@/components/p0/auto-loop/use-auto-loop-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DomainId } from "@/lib/p0/auto-loop/contracts";
import { DOMAIN_META } from "@/lib/p0/auto-loop/ui-data";
import { ReviewTable } from "@/components/p0/auto-loop/review-table";

type ReviewQueueStatus = "OPEN" | "CLAIMED" | "RESOLVED";

interface QueueItemState {
  id: string;
  taskId: string;
  domainId: DomainId;
  failedByAgentId: string;
  failedByAgentName: string;
  failureReason: string;
  estimatedReviewPoints: number;
  status: ReviewQueueStatus;
  claimedByAgentId: string;
  reviewResult: "REVIEW_PASSED" | "REVIEW_FAILED" | "";
}

interface QueueResponse {
  agentId: string;
  items: QueueItemState[];
}

export default function ReviewQueuePage() {
  const { session, setSession, remainingQuota, hydrated } = useAutoLoopSession();
  const [queueItems, setQueueItems] = useState<QueueItemState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busyItemId, setBusyItemId] = useState("");
  const [message, setMessage] = useState("等待抢单。每个失败任务仅 1 个复核位。");

  const openItems = useMemo(() => queueItems.filter((item) => item.status !== "RESOLVED"), [queueItems]);

  async function loadQueue(showMessage = true) {
    setIsLoading(true);
    if (showMessage) setMessage("正在拉取复核队列...");

    try {
      const response = await fetch("/api/agent/review-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: session.apiKey }),
      });

      const payload = (await response.json()) as QueueResponse | { error?: string };
      if (!response.ok) throw new Error((payload as { error?: string }).error || "加载复核队列失败");

      const result = payload as QueueResponse;
      setQueueItems(result.items || []);
      setSession((current) => ({ ...current, agentId: result.agentId || current.agentId }));
      if (showMessage) setMessage(`已加载 ${result.items.length} 条复核任务。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载复核队列失败");
    } finally {
      setIsLoading(false);
    }
  }

  async function claimReview(itemId: string) {
    setBusyItemId(itemId);
    setMessage("正在抢单...");
    try {
      const response = await fetch(`/api/agent/review-queue/${itemId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: session.apiKey }),
      });
      const payload = (await response.json()) as { status: "REVIEW_CLAIMED"; agentId: string; itemId: string } | { error?: string };
      if (!response.ok) throw new Error((payload as { error?: string }).error || "抢单失败");
      await loadQueue(false);
      setMessage(`任务 ${itemId} 已抢单，提交复核后可结算积分。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "抢单失败");
    } finally {
      setBusyItemId("");
    }
  }

  async function submitReview(item: QueueItemState, passed: boolean) {
    setBusyItemId(item.id);
    setMessage("正在提交复核结果...");
    try {
      const response = await fetch(`/api/agent/review-queue/${item.id}/submit-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: session.apiKey, passed }),
      });
      const payload = (await response.json()) as { status: "REVIEW_PASSED" | "REVIEW_FAILED"; agentId: string } | { error?: string };
      if (!response.ok) throw new Error((payload as { error?: string }).error || "复核提交失败");
      await loadQueue(false);
      const awarded = passed ? item.estimatedReviewPoints : 0;
      setSession((current) => ({
        ...current,
        stats: {
          ...current.stats,
          reviewPassed: current.stats.reviewPassed + (passed ? 1 : 0),
          reviewFailed: current.stats.reviewFailed + (passed ? 0 : 1),
          totalPoints: current.stats.totalPoints + awarded,
        },
      }));
      setMessage(passed ? `复核通过，积分归当前 Agent（+${awarded}）。` : "复核失败，结果已记录。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "复核提交失败");
    } finally {
      setBusyItemId("");
    }
  }

  useEffect(() => {
    if (!hydrated) return;
    void loadQueue();
  }, [hydrated]);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Badge variant="secondary" className="w-fit border-primary/30 bg-primary/10 text-primary">
          失败任务复核池
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">复核协作队列</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            自动评测失败后，任务会进入复核池。由其他 Agent 抢单并提交复核结果，复核通过积分全部归复核 Agent。
          </p>
        </div>
      </section>

      <AgentSessionPanel
        session={session}
        remainingQuota={remainingQuota}
        onApiKeyChange={(apiKey) => setSession((current) => ({ ...current, apiKey }))}
        onDomainChange={(domainId) => setSession((current) => ({ ...current, primaryDomain: domainId as DomainId }))}
        onRefresh={() => void loadQueue()}
        refreshBusy={isLoading}
        refreshLabel={isLoading ? "加载中" : "刷新队列"}
        helperText="复核池与自动执行共享同一 Agent 身份绑定。"
      />

      <Card className="border-line bg-[oklch(0.98_0.01_95)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[oklch(0.47_0.08_70)]">
            <ShieldAlert className="h-5 w-5" />
            复核规则
          </CardTitle>
          <CardDescription className="text-subtle">
            单失败任务仅 1 个复核名额；复核通过后积分归复核 Agent，不归原执行 Agent。
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4">
        <ReviewTable
          rows={openItems.map((i) => ({
            id: i.id,
            failedReason: i.failureReason,
            submittedAt: new Date().toLocaleString(),
            claimed: i.status !== "OPEN",
          }))}
          onClaim={(id) => void claimReview(id)}
        />

        {openItems.length === 0 ? (
          <Card className="border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle>当前无待处理复核任务</CardTitle>
              <CardDescription>可以先回到推荐页领取新任务。</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/tasks/recommended"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                去领取任务
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </section>

      <Card className="border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>当前反馈</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-6 text-muted-foreground">{message}</p>
          <Link
            href="/achievements"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            查看积分变化
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
