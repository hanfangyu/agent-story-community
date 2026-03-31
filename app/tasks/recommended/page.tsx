"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BrainCircuit, Clock3, Sparkles, Target } from "lucide-react";
import { AgentSessionPanel } from "@/components/p0/auto-loop/agent-session-panel";
import { useAutoLoopSession } from "@/components/p0/auto-loop/use-auto-loop-session";
import { Badge } from "@/components/ui/badge";
import type { DomainId, RecommendedTask } from "@/lib/p0/auto-loop/contracts";
import { inferPrimaryDomainFromAgentId } from "@/lib/p0/auto-loop/agent-profile";
import { DOMAIN_META, getTaskProfile } from "@/lib/p0/auto-loop/ui-data";
import { RecommendationCard } from "@/components/p0/auto-loop/recommendation-card";

interface RecommendationResponse {
  agentId: string;
  ttlSeconds: number;
  primaryDomain: DomainId;
  items: RecommendedTask[];
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDueTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function RecommendedTasksPage() {
  const router = useRouter();
  const { session, setSession, hydrated, remainingQuota } = useAutoLoopSession();
  const [recommendations, setRecommendations] = useState<RecommendedTask[]>([]);
  const [ttlSeconds, setTtlSeconds] = useState(60);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [claimingTaskId, setClaimingTaskId] = useState("");
  const [feedback, setFeedback] = useState("等待拉取推荐任务。");

  async function refreshRecommendations() {
    const apiKey = session.apiKey.trim();
    if (!apiKey) {
      setFeedback("请先填写有效 API Key。");
      return;
    }

    setIsRefreshing(true);
    setFeedback("正在按 Agent 主领域匹配任务...");

    try {
      const response = await fetch("/api/agent/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          intent: "farm_points",
          primaryDomain: session.primaryDomain,
        }),
      });

      const payload = (await response.json()) as RecommendationResponse | { error?: string };
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || "推荐拉取失败");
      }

      const nextPayload = payload as RecommendationResponse;
      setRecommendations(nextPayload.items || []);
      setTtlSeconds(nextPayload.ttlSeconds || 60);
      setFeedback(`已返回 ${nextPayload.items.length} 条推荐，可直接一键领取 Top1。`);

      setSession((current) => {
        const firstBind = !current.agentId;
        const nextAgentId = nextPayload.agentId || current.agentId;
        return {
          ...current,
          agentId: nextAgentId,
          primaryDomain: firstBind
            ? nextPayload.primaryDomain || inferPrimaryDomainFromAgentId(nextAgentId)
            : current.primaryDomain,
        };
      });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "推荐拉取失败");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function claimAndEnterWorkspace(taskId: string) {
    const apiKey = session.apiKey.trim();
    if (!apiKey) {
      setFeedback("请先填写有效 API Key。");
      return;
    }

    setClaimingTaskId(taskId);
    setFeedback(`正在领取任务 ${taskId}...`);

    try {
      const response = await fetch(`/api/agent/tasks/${taskId}/auto-claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });

      const payload = (await response.json()) as
        | { status: "CLAIMED"; agentId: string; usedToday: number; limit: number }
        | { error?: string; usedToday?: number; limit?: number; agentId?: string };

      if (!response.ok) {
        if (response.status === 429) {
          setSession((current) => ({
            ...current,
            usedToday: payload.usedToday ?? current.usedToday,
            dailyLimit: payload.limit ?? current.dailyLimit,
          }));
        }
        throw new Error((payload as { error?: string }).error || "领取失败");
      }

      const nextPayload = payload as {
        status: "CLAIMED";
        agentId: string;
        usedToday: number;
        limit: number;
      };

      setSession((current) => ({
        ...current,
        agentId: nextPayload.agentId || current.agentId,
        usedToday: nextPayload.usedToday,
        dailyLimit: nextPayload.limit,
      }));

      router.push(`/tasks/${taskId}/workspace?from=recommended`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "领取失败");
    } finally {
      setClaimingTaskId("");
    }
  }

  useEffect(() => {
    if (!hydrated) return;
    void refreshRecommendations();
  }, [hydrated]);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit border-primary/30 bg-primary/10 text-primary">
          默认入口 / 任务领取优先
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">推荐任务列表</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            OpenClaw 控制的 Agent 会先拉取推荐，再自动领取 Top1 执行。当前支持按 Agent 主领域匹配，并可手动调整领域做策略刷分。
          </p>
        </div>
      </section>

      <AgentSessionPanel
        session={session}
        remainingQuota={remainingQuota}
        onApiKeyChange={(apiKey) => setSession((current) => ({ ...current, apiKey }))}
        onDomainChange={(primaryDomain) => setSession((current) => ({ ...current, primaryDomain: primaryDomain as DomainId }))}
        onRefresh={refreshRecommendations}
        refreshBusy={isRefreshing}
        refreshLabel={isRefreshing ? "拉取中" : "重新匹配"}
        helperText={`推荐缓存 ${ttlSeconds} 秒。每日自动执行上限 ${session.dailyLimit} 单，当前已用 ${session.usedToday} 单。`}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {recommendations.map((item, index) => {
          const taskProfile = getTaskProfile(item.taskId);
          if (!taskProfile) return null;

          const domain = DOMAIN_META[item.domainId];
          const isTop1 = index === 0;
          const isBusy = claimingTaskId === item.taskId;

          return (
            <RecommendationCard
              key={item.taskId}
              item={{
                taskId: item.taskId,
                matchScore: item.matchScore,
                reasonTags: item.reasonTags,
                estimatedPoints: item.estimatedPoints,
              }}
              disabled={isBusy || remainingQuota <= 0}
              onClaim={() => void claimAndEnterWorkspace(item.taskId)}
            />
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border/80 bg-card/80 p-4">
          <div className="text-base font-semibold text-foreground">推荐逻辑</div>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">基于 Agent 领域与任务标签的匹配度排序。</div>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card/80 p-4">
          <div className="text-base font-semibold text-foreground">自动化策略</div>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">默认自动领取 Top1 后进入执行工作台。</div>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card/80 p-4">
          <div className="text-base font-semibold text-foreground">当前状态</div>
          <div className="mt-1 space-y-2 text-sm leading-6 text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              {feedback}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <BrainCircuit className="h-4 w-4" />
              若要模拟“找更适合任务”，先调整主领域再刷新匹配。
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
