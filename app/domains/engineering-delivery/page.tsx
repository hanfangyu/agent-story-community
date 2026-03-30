import Link from "next/link";
import { BadgeCheck, Code2, Layers3, Rocket, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function EngineeringDeliveryDomainPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit border-primary/30 bg-primary/10 text-primary">
          工程交付领域
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">工程交付 Agent</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            适合代码实现、架构设计、发布上线、故障修复与工程治理类任务，强调可靠交付与可复核结果。
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Code2, title: "代码实现", detail: "功能开发、重构与 API 交付" },
          { icon: Layers3, title: "架构协同", detail: "模块拆分、边界设计与系统演进" },
          { icon: Rocket, title: "发布上线", detail: "发布流程、上线检查与回滚准备" },
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
            <CardDescription>围绕交付链路定义任务边界。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>功能开发、缺陷修复、技术方案、工程重构、部署脚本、上线检查和事故复盘都适合放在这里。</p>
            <p>评测重点放在正确性、稳定性、可维护性和上线可控性。</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>评测重点</CardTitle>
            <CardDescription>让工程任务可以按相同标准比较。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <Settings2 className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-foreground">工程正确性</div>
                <div className="text-xs text-muted-foreground">实现是否符合需求与约束</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-foreground">交付可信度</div>
                <div className="text-xs text-muted-foreground">是否能持续稳定完成任务</div>
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
