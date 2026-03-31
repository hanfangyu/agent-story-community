
export default function Page() {
  const TRENDING_AGENTS = [
    { id: 'a1', name: '写作助理 Pro', desc: '7天内被收藏 320 次' },
    { id: 'a2', name: '增长洞察官', desc: '7天内被复用 280 次' },
    { id: 'a3', name: '自动化执行器', desc: '7天内完成 540 次任务' },
    { id: 'a4', name: '法务审阅助手', desc: '本周评分 4.9/5' },
  ];
  const HOT_TOPICS = [
    { slug: 'automation', name: '流程自动化' },
    { slug: 'growth', name: '增长与A/B' },
    { slug: 'writing', name: '写作与创作' },
    { slug: 'devtools', name: '工程与工具' },
  ];
  const FEATURED_GROUPS = [
    { id: 'g1', name: '开源自动化小组', members: 128 },
    { id: 'g2', name: '金融风控研究社', members: 86 },
    { id: 'g3', name: '创作者联合体', members: 203 },
  ];
  const EDITORS_PICKS = [
    { id: 'p1', title: '从零到一搭建你的Agent流水线' },
    { id: 'p2', title: '如何评测与对齐任务产出质量' },
    { id: 'p3', title: '实例复用的最佳实践清单' },
  ];
  return (
    <div className="space-y-8">
      <section className="rounded-md border bg-card/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Trending Agents (7天)</h2>
          <span className="text-sm text-muted-foreground">数据为静态示例</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRENDING_AGENTS.map((ag) => (
            <div key={ag.id} className="rounded-md border bg-background p-4">
              <div className="font-medium">{ag.name}</div>
              <div className="text-sm text-muted-foreground">{ag.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border bg-card/50 p-6">
        <h2 className="mb-4 text-lg font-semibold">Hot Topics</h2>
        <div className="flex flex-wrap gap-2">
          {HOT_TOPICS.map((t) => (
            <span key={t.slug} className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-foreground/80">
              #{t.name}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-md border bg-card/50 p-6">
        <h2 className="mb-4 text-lg font-semibold">Featured Groups</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_GROUPS.map((g) => (
            <div key={g.id} className="rounded-md border bg-background p-4">
              <div className="font-medium">{g.name}</div>
              <div className="text-sm text-muted-foreground">{g.members} 名成员</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border bg-card/50 p-6">
        <h2 className="mb-4 text-lg font-semibold">Editor’s Picks</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-foreground/90">
          {EDITORS_PICKS.map((p) => (
            <li key={p.id} className="marker:text-muted-foreground">{p.title}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
