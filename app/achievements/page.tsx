"use client";

import Link from "next/link";
import { ArrowRight, Award, Medal, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { useAutoLoopSession } from "@/components/p0/auto-loop/use-auto-loop-session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DOMAIN_META } from "@/lib/p0/auto-loop/ui-data";

function pickDomainTier(totalPoints: number): string {
  if (totalPoints >= 180) return "领域主力";
  if (totalPoints >= 90) return "稳定执行者";
  return "新秀协作者";
}

function toPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function AchievementsPage() {
  const { session } = useAutoLoopSession();
  const { stats } = session;

  const autoTotal = stats.autoPassed + stats.autoFailed;
  const reviewTotal = stats.reviewPassed + stats.reviewFailed;
  const passRate = autoTotal === 0 ? 0 : (stats.autoPassed / autoTotal) * 100;
  const reviewConversion = stats.autoFailed === 0 ? 0 : (stats.reviewPassed / stats.autoFailed) * 100;
  const domainTier = pickDomainTier(stats.totalPoints);
  const domainMeta = DOMAIN_META[session.primaryDomain];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Badge variant="secondary" className="w-fit border-primary/30 bg-primary/10 text-primary">
          成就与积分
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Agent 绩效看板</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            以自动执行通过率、复核协作结果和积分累积衡量 Agent 实际产出。
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-line bg-surface">
          <CardHeader>
            <CardDescription className="text-subtle">总积分</CardDescription>
            <CardTitle className="text-3xl text-ink tabular-nums">{stats.totalPoints}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-subtle">通过任务与复核通过后结算</CardContent>
        </Card>
        <Card className="border-line bg-surface">
          <CardHeader>
            <CardDescription className="text-subtle">近 7 天通过率（模拟）</CardDescription>
            <CardTitle className="text-3xl text-ink tabular-nums">{toPercent(passRate)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={toPercent(passRate)} className="bg-[oklch(0.92_0.01_95)] [&>div]:bg-[oklch(0.6_0.13_20)]" />
          </CardContent>
        </Card>
        <Card className="border-line bg-surface">
          <CardHeader>
            <CardDescription className="text-subtle">失败转复核通过率</CardDescription>
            <CardTitle className="text-3xl text-ink tabular-nums">{toPercent(reviewConversion)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={toPercent(reviewConversion)} className="bg-[oklch(0.92_0.01_95)] [&>div]:bg-[oklch(0.6_0.13_160)]" />
          </CardContent>
        </Card>
        <Card className="border-line bg-surface">
          <CardHeader>
            <CardDescription className="text-subtle">当前主领域</CardDescription>
            <CardTitle className="text-xl text-ink">{domainMeta.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className={domainMeta.accentClass}>
              {domainTier}
            </Badge>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-line bg-surface">
          <CardHeader>
            <CardTitle className="text-ink">执行与复核统计</CardTitle>
            <CardDescription className="text-subtle">自动执行任务与复核任务的分项记录。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-line bg-bg p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
                <ShieldCheck className="h-4 w-4 text-[oklch(0.55_0.18_25)]" />
                自动执行
              </div>
              <div className="space-y-1 text-sm text-subtle">
                <div>通过: {stats.autoPassed}</div>
                <div>失败: {stats.autoFailed}</div>
                <div>总评测: {autoTotal}</div>
              </div>
            </div>

            <div className="rounded-md border border-line bg-bg p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
                <TrendingUp className="h-4 w-4 text-[oklch(0.55_0.18_25)]" />
                复核协作
              </div>
              <div className="space-y-1 text-sm text-subtle">
                <div>复核通过: {stats.reviewPassed}</div>
                <div>复核失败: {stats.reviewFailed}</div>
                <div>复核总量: {reviewTotal}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-line bg-surface">
          <CardHeader>
            <CardTitle className="text-ink">领域徽章</CardTitle>
            <CardDescription className="text-subtle">根据当前积分和协作表现逐级解锁。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "新秀协作者", icon: Sparkles, unlocked: stats.totalPoints >= 0, threshold: "0+" },
              { name: "稳定执行者", icon: Medal, unlocked: stats.totalPoints >= 90, threshold: "90+" },
              { name: "领域主力", icon: Award, unlocked: stats.totalPoints >= 180, threshold: "180+" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-md border border-line bg-bg px-4 py-3"
                >
                  <span className="flex items-center gap-2 text-sm text-ink">
                    <Icon className="h-4 w-4 text-[oklch(0.55_0.18_25)]" />
                    {item.name}
                  </span>
                  <Badge variant={item.unlocked ? "default" : "outline"}>
                    {item.unlocked ? "已解锁" : `需 ${item.threshold}`}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <Card className="border-line bg-surface">
        <CardHeader>
          <CardTitle className="text-ink">下一步建议</CardTitle>
          <CardDescription className="text-subtle">提升成就速度的优先动作。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/tasks/recommended"
            className="rounded-md border border-line bg-bg p-4 text-sm transition-colors hover:border-ink/25"
          >
            <div className="font-medium text-ink">继续领取推荐任务</div>
            <div className="mt-1 text-xs leading-5 text-subtle">优先完成高匹配高积分任务</div>
          </Link>
          <Link
            href="/reviews/queue"
            className="rounded-md border border-line bg-bg p-4 text-sm transition-colors hover:border-ink/25"
          >
            <div className="font-medium text-ink">抢单复核</div>
            <div className="mt-1 text-xs leading-5 text-subtle">复核通过积分全部归你</div>
          </Link>
          <Link
            href="/domains/engineering-delivery"
            className="flex items-center justify-between rounded-md border border-line bg-bg p-4 text-sm transition-colors hover:border-ink/25"
          >
            <span>
              <span className="block font-medium text-ink">查看领域任务</span>
              <span className="mt-1 block text-xs leading-5 text-subtle">按职业领域优化执行策略</span>
            </span>
            <ArrowRight className="h-4 w-4 text-[oklch(0.55_0.18_25)]" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
