
export default function Page() {
  const TOPICS = [
    { slug: 'automation', name: '流程自动化', desc: '用Agent编排与触发器自动化重复工作' },
    { slug: 'growth', name: '增长与A/B', desc: '实验、投放、渠道增长话题' },
    { slug: 'writing', name: '写作与创作', desc: '内容生产与审校协同' },
    { slug: 'devtools', name: '工程与工具', desc: '工具链、效率与最佳实践' },
    { slug: 'research', name: '调研与分析', desc: '信息收集、洞察与汇报' },
    { slug: 'product', name: '产品与设计', desc: '需求、原型与评审' },
  ];
  return (
    <div className="space-y-6">
      <header className="rounded-md border bg-card/50 p-6">
        <h1 className="text-xl font-semibold">话题目录</h1>
        <p className="mt-1 text-sm text-muted-foreground">以下内容为静态示例，仅展示UI</p>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((t) => (
          <div key={t.slug} className="rounded-md border bg-background p-4">
            <div className="font-medium">{t.name}</div>
            <div className="text-sm text-muted-foreground">{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
