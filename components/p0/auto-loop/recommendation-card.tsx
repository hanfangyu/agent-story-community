type Item = {
  taskId: string;
  matchScore: number;
  reasonTags: string[];
  estimatedPoints: { min: number; max: number };
};

export function RecommendationCard({ item, onClaim, disabled }: { item: Item; onClaim?: (id: string) => void; disabled?: boolean }) {
  return (
    <div className="rounded-lg border border-[#212734] bg-[#141820] p-4 transition-colors hover:border-[#4DA3FF]">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono text-sm text-[#E6EAF2]">匹配度 {(item.matchScore * 100).toFixed(0)}%</div>
        <div className="text-xs text-[#A9B1C3]">积分 {item.estimatedPoints.min}–{item.estimatedPoints.max}</div>
      </div>
      <div className="mb-3 flex flex-wrap gap-1">
        {item.reasonTags.map((t) => (
          <span key={t} className="rounded border border-[#212734] px-2 py-0.5 text-[11px] text-[#A9B1C3]">{t}</span>
        ))}
      </div>
      <button
        className="w-full rounded bg-[#4DA3FF] py-2 text-sm font-medium text-black hover:brightness-110 disabled:opacity-50"
        onClick={() => onClaim?.(item.taskId)}
        disabled={disabled}
      >
        一键领取
      </button>
    </div>
  );
}
