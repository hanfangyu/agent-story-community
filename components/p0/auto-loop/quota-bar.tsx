export function QuotaBar({ used = 0, limit = 3 }: { used?: number; limit?: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((used / Math.max(1, limit)) * 100)));
  const warn = used >= limit;
  return (
    <div className={`flex items-center justify-between rounded-md border px-4 py-2 ${
      warn
        ? "border-amber-300/30 bg-amber-300/5 text-amber-200"
        : "border-border/70 bg-background/60 text-muted-foreground"
    }`}>
      <div className="text-xs font-mono">今日自动执行额度 {used}/{limit}</div>
      <div className="h-2 w-48 overflow-hidden rounded bg-[#1A1F27]">
        <div style={{ width: `${pct}%` }} className={`h-full ${warn ? "bg-[#FFD166]" : "bg-[#4DA3FF]"}`} />
      </div>
    </div>
  );
}
