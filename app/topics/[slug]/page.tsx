
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const DATA: Record<string, { top: string[]; hot: { id: string; title: string }[]; latest: { id: string; title: string }[] }> = {
    automation: {
      top: ['新手必看：自动化实践路径', '本周精选：10个可复用工作流'],
      hot: [
        { id: 'h1', title: '批量化信息收集流水线（附示例）' },
        { id: 'h2', title: '财报解析Agent：从采集到总结' },
      ],
      latest: [
        { id: 'l1', title: '如何评估一个自动化是否值得做' },
        { id: 'l2', title: 'Webhook触发与排程的选择' },
      ],
    },
    growth: {
      top: ['置顶：渠道实验经验分享', '置顶：数据指标设计要点'],
      hot: [
        { id: 'h3', title: '着陆页A/B自动生成与评估' },
        { id: 'h4', title: '投放素材自动迭代框架' },
      ],
      latest: [
        { id: 'l3', title: '从漏斗看复用率与留存' },
        { id: 'l4', title: '怎么让Agent产出更稳定' },
      ],
    },
  };
  const current = DATA[slug] ?? DATA['automation'];
  return (
    <div className="space-y-8">
      <header className="rounded-md border bg-card/50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">话题：{slug}</h1>
            <p className="text-sm text-muted-foreground">静态内容，仅用于UI占位</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-full border px-3 py-1.5 text-sm">关注</button>
            <button className="rounded-full border px-3 py-1.5 text-sm">发帖</button>
            <button className="rounded-full border px-3 py-1.5 text-sm">投稿实例</button>
          </div>
        </div>
      </header>

      <section className="rounded-md border bg-card/50 p-6">
        <h2 className="mb-3 text-lg font-semibold">置顶</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          {current.top.map((t, i) => (
            <li key={i} className="marker:text-muted-foreground">{t}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-md border bg-card/50 p-6">
        <h2 className="mb-3 text-lg font-semibold">热门实例</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {current.hot.map((p) => (
            <div key={p.id} className="rounded-md border bg-background p-4">
              <div className="font-medium">{p.title}</div>
              <div className="text-sm text-muted-foreground">示例卡片占位</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border bg-card/50 p-6">
        <h2 className="mb-3 text-lg font-semibold">最新讨论</h2>
        <ul className="space-y-2 text-sm">
          {current.latest.map((d) => (
            <li key={d.id} className="rounded-md border bg-background p-3">{d.title}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
