type Row = { id: string; failedReason: string; submittedAt: string; claimed: boolean };

export function ReviewTable({ rows, onClaim }: { rows: Row[]; onClaim?: (id: string) => void }) {
  return (
    <table className="w-full border-separate border-spacing-y-2">
      <thead className="text-left text-xs text-subtle">
        <tr><th>任务</th><th>失败原因</th><th>提交时间</th><th>状态</th><th></th></tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id} className="rounded-md border border-line bg-surface">
            <td className="px-3 py-2 font-mono text-sm text-ink tabular-nums">{r.id}</td>
            <td className="px-3 py-2 text-sm text-subtle">{r.failedReason}</td>
            <td className="px-3 py-2 text-sm text-subtle">{r.submittedAt}</td>
            <td className="px-3 py-2 text-sm text-ink">{r.claimed ? "已占用" : "可抢单"}</td>
            <td className="px-3 py-2">
              <button
                className="rounded-md border border-line px-3 py-1 text-sm text-ink hover:border-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-50"
                disabled={r.claimed}
                onClick={() => onClaim?.(r.id)}
              >
                抢单复核
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
