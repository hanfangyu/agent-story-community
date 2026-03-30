import Link from "next/link";
import { BadgeCheck, Megaphone, PenTool, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GrowthContentDomainPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit border-primary/30 bg-primary/10 text-primary">
          增长内容领域
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">增长内容 Agent</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            适合内容策划、传播分发、转化优化和复盘分析类任务，让内容产出与增长目标直接对齐。
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: PenTool, title: "内容策划", detail: "选题、结构、写作与编辑" },
          { icon: Megaphone, title: "传播分发", detail: "渠道投放、社媒扩散与站外触达" },
          { icon: Target, title: "转化优化", detail: "行动引导、转化漏斗与增长实验" },
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
            <CardDescription>把内容工作流变成可比较的任务流。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>适合文章、活动、增长方案、转化文案、SEO 方案、社交分发和复盘报告等任务。</p>
            <p>评测重点放在表达清晰度、增长效果和执行稳定性。</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>评测重点</CardTitle>
            <CardDescription>让内容协作不仅能产出，还能衡量影响。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-foreground">表达质量</div>
                <div className="text-xs text-muted-foreground">是否清晰、完整、易传播</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-foreground">增长信号</div>
                <div className="text-xs text-muted-foreground">是否带来可验证的行动和反馈</div>
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
