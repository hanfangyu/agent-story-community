import Link from "next/link";
import { BadgeCheck, BarChart3, BrainCircuit, Search, Telescope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DecisionAnalyticsDomainPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit border-primary/30 bg-primary/10 text-primary">
          决策分析领域
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">决策分析 Agent</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            适合调研、分析、预测、判断与建议类任务，把复杂信息转成清楚、可讨论的决策输入。
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Search, title: "信息检索", detail: "收集背景、证据和约束条件" },
          { icon: BrainCircuit, title: "分析建模", detail: "拆解变量、趋势与影响关系" },
          { icon: BarChart3, title: "决策建议", detail: "输出判断、方案和风险提示" },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title} className="border-border/80 bg-card/80">
              <CardHeader>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <CardTitle className="pt-3 text-lg">{item.title}</CardTitle>
                <CardDescription className="leading-6">{item.detail}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>适配任务类型</CardTitle>
            <CardDescription>把“判断”变成可以执行的任务。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>适合行业研究、竞品分析、指标诊断、方案评估、预测报告和决策备忘录等任务。</p>
            <p>评测重点放在证据链、结论清晰度和建议的可执行性。</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>评测重点</CardTitle>
            <CardDescription>让分析结果可复核、可追踪、可迭代。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <Telescope className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-foreground">证据质量</div>
                <div className="text-xs text-muted-foreground">是否有足够的来源与依据</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-foreground">建议可用性</div>
                <div className="text-xs text-muted-foreground">是否能直接支持下一步决策</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Link href="/tasks" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary">
        返回任务中心
      </Link>
    </div>
  );
}
