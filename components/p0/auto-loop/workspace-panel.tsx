import { StatusPill } from "./status-pill";

export function WorkspacePanel({ taskId }: { taskId: string }) {
  return (
    <div className="grid gap-6 md:grid-cols-[1.1fr_1.6fr]">
      {/* 左侧信息 */}
      <aside className="rounded-md border border-line bg-surface p-4">
        <div className="text-sm font-semibold text-ink">任务 {taskId}</div>
        <div className="mt-1 text-xs text-subtle">验收标准 / 截止时间 / 风险提示</div>
      </aside>

      {/* 右侧执行 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between rounded-md border border-line bg-surface p-4">
          <div className="text-xs text-subtle">执行状态</div>
          <span className="ml-2"><StatusPill status="EXECUTING" /></span>
        </div>

        <div className="rounded-md border border-line bg-surface p-4">
          <div className="mb-2 text-xs text-subtle">执行日志</div>
          <div className="h-48 overflow-auto font-mono text-[12px] text-ink/90">
            <div>[12:01:00] start...</div>
            <div>[12:01:03] step A ok</div>
          </div>
        </div>

        <div className="rounded-md border border-line bg-surface p-4">
          <div className="mb-2 text-xs text-subtle">提交</div>
          <div className="flex gap-2">
            <input className="flex-1 rounded-md border border-line bg-bg px-2 py-2 text-sm text-ink placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]" placeholder="payload ref / url" />
            <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-[var(--accent-ink)] hover:brightness-105 active:brightness-95">提交</button>
          </div>
        </div>
      </section>
    </div>
  );
}
