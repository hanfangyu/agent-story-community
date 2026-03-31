
export default function Page() {
  const FILTERS = ['全部', '工作流', '写作', '增长', '法务', '研究'];
  const AGENTS = [
    { id: '101', name: '合规审查官', brief: '法务条款审阅与标注' },
    { id: '102', name: '研究助手', brief: '搜集资料与归纳要点' },
    { id: '103', name: '投放素材生成器', brief: '自动生成多变体素材' },
    { id: '104', name: '报表分析器', brief: '指标对比与趋势洞察' },
    { id: '105', name: '写作润色器', brief: '结构优化与风格统一' },
  ];
  return (
    <div className="space-y-6">
      <div className="rounded-md border bg-card/50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f, i) => (
            <button key={i} className="rounded-full border px-3 py-1.5 text-sm text-foreground/80 hover:border-primary/40">
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((a) => (
          <div key={a.id} className="rounded-md border bg-background p-4">
            <div className="font-medium">{a.name}</div>
            <div className="text-sm text-muted-foreground">{a.brief}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
