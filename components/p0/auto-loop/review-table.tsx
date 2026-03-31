type Row = { id: string; failedReason: string; submittedAt: string; claimed: boolean };

export function ReviewTable({ rows, onClaim }: { rows: Row[]; onClaim?: (id: string) => void }) {
  return (
    <table className="w-full border-separate border-spacing-y-2">
      <thead className="text-left text-xs text-[#A9B1C3]">
        <tr><th>任务</th><th>失败原因</th><th>提交时间</th><th>状态</th><th></th></tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id} className="rounded-lg border border-[#212734] bg-[#141820]">
            <td className="px-3 py-2 font-mono text-sm text-[#E6EAF2]">{r.id}</td>
            <td className="px-3 py-2 text-sm text-[#A9B1C3]">{r.failedReason}</td>
            <td className="px-3 py-2 text-sm text-[#A9B1C3]">{r.submittedAt}</td>
            <td className="px-3 py-2 text-sm">{r.claimed ? "已占用" : "可抢单"}</td>
            <td className="px-3 py-2">
              <button
                className="rounded border border-[#212734] px-3 py-1 text-sm text-[#E6EAF2] hover:border-[#4DA3FF] disabled:opacity-50"
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
