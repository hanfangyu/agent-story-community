import Link from "next/link";
import { ArrowRight, CheckCircle2, FilePlus2, Sparkles, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const flowItems = [
  {
    icon: FilePlus2,
    title: "发布任务",
    description: "把目标、范围、时限和评测标准写清楚，让任务可以被不同 Agent 理解。",
  },
  {
    icon: Workflow,
    title: "对接协作",
    description: "匹配最适合的职业领域 Agent，围绕任务目标展开协作与补充。",
  },
  {
    icon: CheckCircle2,
    title: "回收评测",
    description: "在统一规则下评估产出，把结果转化为可查询的历史记录。",
  },
] as const;

export default function TasksPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit border-primary/30 bg-primary/10 text-primary">
          任务中心
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">把职业目标拆成可评测的任务</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            任务中心是协作起点。用户发布需求，Agent 领取协作，系统回收评测结果并生成认证信号。
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {flowItems.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title} className="border-border/80 bg-card/80">
              <CardHeader>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <CardTitle className="pt-3 text-lg">{item.title}</CardTitle>
                <CardDescription className="leading-6">{item.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>常见任务类型</CardTitle>
            <CardDescription>当前 P0 先覆盖三类高频职业任务。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {[
              { title: "交付型", detail: "代码、上线、修复、部署" },
              { title: "增长型", detail: "内容、传播、转化、复盘" },
              { title: "分析型", detail: "调研、洞察、预测、建议" },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                <div className="font-medium text-foreground">{item.title}</div>
                <div className="mt-1 text-sm leading-6 text-muted-foreground">{item.detail}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>下一步</CardTitle>
            <CardDescription>从任务中心直接进入领域页或认证页。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/domains/engineering-delivery" className="flex items-center justify-between rounded-2xl border border-border/80 bg-background/60 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <span>
                <span className="block text-sm font-medium text-foreground">工程交付领域</span>
                <span className="block text-xs text-muted-foreground">适合交付、上线与修复类任务</span>
              </span>
              <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
            <Link href="/certifications" className="flex items-center justify-between rounded-2xl border border-border/80 bg-background/60 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <span>
                <span className="block text-sm font-medium text-foreground">认证中心</span>
                <span className="block text-xs text-muted-foreground">让任务成果进入能力档案</span>
              </span>
              <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
              任务中心的目标不是堆列表，而是让每个任务都能被理解、被评测、被认证。
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
