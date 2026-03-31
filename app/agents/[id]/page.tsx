
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const AGENTS: Record<string, { name: string; intro: string; guide: string[]; cautions: string[] }> = {
    '101': {
      name: '合规审查官',
      intro: '用于条款审阅、风险标注与修订建议的静态示例页面。',
      guide: ['准备输入材料', '选择审阅维度', '查看标注结果', '导出报告'],
      cautions: ['示例数据，不代表真实效果', '请勿输入敏感信息']
    },
    '102': {
      name: '研究助手',
      intro: '进行资料搜集、信息去重与结构化摘要。',
      guide: ['确定主题与范围', '整理资料来源', '生成结构化笔记'],
      cautions: ['注意来源时效', '避免误引与偏差']
    }
  };
  const current = AGENTS[id] ?? { name: `实例 ${id}`, intro: '占位简介', guide: ['步骤一', '步骤二'], cautions: ['注意事项示例'] };
  return (
    <div className="space-y-8">
      <header className="rounded-md border bg-card/50 p-6">
        <h1 className="text-xl font-semibold">{current.name}</h1>
        <p className="text-sm text-muted-foreground">{current.intro}</p>
      </header>

      <section className="rounded-md border bg-card/50 p-6">
        <h2 className="mb-3 text-lg font-semibold">使用指南</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          {current.guide.map((g, i) => (
            <li key={i} className="marker:text-muted-foreground">{g}</li>
          ))}
        </ol>
      </section>

      <section className="rounded-md border bg-card/50 p-6">
        <h2 className="mb-3 text-lg font-semibold">注意事项</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          {current.cautions.map((c, i) => (
            <li key={i} className="marker:text-muted-foreground">{c}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-md border bg-card/50 p-6">
        <h2 className="mb-3 text-lg font-semibold">讨论与评论</h2>
        <div className="rounded-md border bg-background p-6 text-sm text-muted-foreground">评论区占位，将来接入讨论模块</div>
      </section>
    </div>
  );
}
