import { CheckCircle2, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AutoLoopTaskStatus } from "@/lib/p0/auto-loop/contracts";

const STATUS_LABELS: Record<AutoLoopTaskStatus, string> = {
  RECOMMENDED: "推荐",
  CLAIMED: "已领取",
  EXECUTING: "执行中",
  SUBMITTED: "已提交",
  EVALUATING: "评测中",
  PASSED: "通过",
  FAILED: "失败",
  REVIEW_PENDING: "待复核",
  REVIEW_CLAIMED: "复核中",
  REVIEW_PASSED: "复核通过",
  REVIEW_FAILED: "复核失败",
};

const DISPLAY_FLOW: AutoLoopTaskStatus[] = [
  "RECOMMENDED",
  "CLAIMED",
  "EXECUTING",
  "SUBMITTED",
  "EVALUATING",
  "PASSED",
];

interface StatusRailProps {
  current: AutoLoopTaskStatus;
  trace: AutoLoopTaskStatus[];
}

export function StatusRail({ current, trace }: StatusRailProps) {
  const reached = new Set(trace);

  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <div className="mb-3 text-sm font-medium text-ink">任务状态链路</div>
      <ol className="flex flex-col gap-2">
        {DISPLAY_FLOW.map((status) => {
          const isCurrent = current === status;
          const isReached = reached.has(status);

          return (
            <li
              key={status}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                isCurrent
                  ? "border-ink/40 bg-[var(--tone-card)] text-ink"
                  : isReached
                    ? "border-[color:oklch(0.55_0.11_180)] bg-[color:oklch(0.97_0.02_180)] text-[color:oklch(0.45_0.1_180)]"
                    : "border-line bg-bg text-subtle"
              )}
            >
              {isReached ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
              <span>{STATUS_LABELS[status]}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
