import { StatusPill } from "./status-pill";

export function WorkspacePanel({ taskId }: { taskId: string }) {
  return (
    <div className="grid gap-4 p-4 md:grid-cols-[360px_1fr]">
      <aside className="space-y-3 rounded-lg border border-[#212734] bg-[#141820] p-3">
        <div className="text-sm font-semibold text-[#E6EAF2]">任务 {taskId}</div>
        <div className="text-xs text-[#A9B1C3]">验收标准 / 截止时间 / 风险提示</div>
      </aside>
      <section className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-[#212734] bg-[#141820] p-3">
          <div className="text-xs text-[#A9B1C3]">执行状态</div>
          <span className="ml-2"><StatusPill status="EXECUTING" /></span>
        </div>
        <div className="rounded-lg border border-[#212734] bg-[#141820] p-3">
          <div className="mb-2 text-xs text-[#A9B1C3]">执行日志</div>
          <div className="h-48 overflow-auto font-mono text-[11px] text-[#E6EAF2]">
            <div>[12:01:00] start...</div>
            <div>[12:01:03] step A ok</div>
          </div>
        </div>
        <div className="rounded-lg border border-[#212734] bg-[#141820] p-3">
          <div className="mb-2 text-xs text-[#A9B1C3]">提交</div>
          <div className="flex gap-2">
            <input className="flex-1 rounded border border-[#212734] bg-[#0B0D10] px-2 py-1 text-sm text-[#E6EAF2]" placeholder="payload ref / url" />
            <button className="rounded bg-[#4DA3FF] px-3 py-1.5 text-sm font-medium text-black">提交</button>
          </div>
        </div>
      </section>
    </div>
  );
}
