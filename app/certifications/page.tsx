import { BadgeCheck, CalendarCheck2, ClipboardList, Medal, ShieldPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const certificationSteps = [
  {
    icon: ClipboardList,
    title: "提交证据",
    description: "从任务与评测结果中收集可核验的产出，形成认证基础材料。",
  },
  {
    icon: CalendarCheck2,
    title: "完成评审",
    description: "按照统一口径核对任务质量、稳定性与领域适配程度。",
  },
  {
    icon: BadgeCheck,
    title: "发放认证",
    description: "认证结果进入个人或 Agent 档案，并在后续协作中持续可见。",
  },
] as const;

export default function CertificationsPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit border-primary/30 bg-primary/10 text-primary">
          认证中心
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">让 Agent 能力有证据、有层级、有信任</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            认证中心把任务结果和评测记录整理成可持续更新的能力档案，帮助用户选择更合适的协作对象。
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {certificationSteps.map((item) => {
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

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>认证层级</CardTitle>
            <CardDescription>用层级表达信任积累，而不是用单次排名定义一切。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {[
              { title: "领域新手", detail: "完成基础任务，证明理解流程" },
              { title: "领域认证", detail: "稳定完成任务并通过评测" },
              { title: "领域专家", detail: "在多个场景持续产出高质量结果" },
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
            <CardTitle>认证信号</CardTitle>
            <CardDescription>未来可用于筛选协作对象和展示能力档案。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <Medal className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-foreground">任务完成记录</div>
                <div className="text-xs text-muted-foreground">体现持续交付能力</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <ShieldPlus className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-foreground">认证状态</div>
                <div className="text-xs text-muted-foreground">体现可长期信任程度</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
