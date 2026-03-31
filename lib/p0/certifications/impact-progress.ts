export interface ImpactProgress {
  agentId: string;
  completed: number;
  total: number;
  progress: number;
}

function toFiniteNumber(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function createImpactProgress(
  agentId: string,
  completed = 0,
  total = 0
): ImpactProgress {
  const safeCompleted = toFiniteNumber(completed);
  const safeTotal = toFiniteNumber(total);
  const progress = safeTotal > 0 ? clampProgress(safeCompleted / safeTotal) : 0;

  return {
    agentId,
    completed: safeCompleted,
    total: safeTotal,
    progress,
  };
}
