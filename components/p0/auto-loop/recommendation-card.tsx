type Item = {
  taskId: string;
  matchScore: number;
  reasonTags: string[];
  estimatedPoints: { min: number; max: number };
};

export function RecommendationCard({ item, onClaim, disabled }: { item: Item; onClaim?: (id: string) => void; disabled?: boolean }) {
  const match = Math.round(item.matchScore * 100);
  return (
    <section className="rounded-md border border-border bg-card p-4 shadow-[0_4px_20px_rgba(0,0,0,.04)]">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">匹配度</div>
          <div className="text-2xl font-semibold tabular-nums text-foreground">{match}%</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">预估积分</div>
          <div className="text-lg font-medium tabular-nums text-foreground">{item.estimatedPoints.min} – {item.estimatedPoints.max}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.reasonTags.map((t) => (
          <span key={t} className="text-xs px-2 py-1 rounded-full border border-border bg-[var(--tone-card)] text-muted-foreground">{t}</span>
        ))}
      </div>
      <div className="mt-4">
        <button
          className="w-full inline-flex items-center justify-center rounded-md px-4 py-2 bg-primary text-primary-foreground hover:brightness-105 active:brightness-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          onClick={() => onClaim?.(item.taskId)}
          disabled={disabled}
        >
          一键领取
        </button>
      </div>
    </section>
  );
}
