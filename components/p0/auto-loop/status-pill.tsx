export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    EXECUTING: "bg-[oklch(0.96_0.02_180)] text-[oklch(0.4_0.06_180)]",
    SUBMITTED: "bg-[oklch(0.96_0.02_260)] text-[oklch(0.4_0.06_260)]",
    EVALUATING: "bg-[oklch(0.96_0.02_330)] text-[oklch(0.4_0.06_330)]",
    PASSED: "bg-[oklch(0.96_0.02_160)] text-[oklch(0.4_0.06_160)]",
    FAILED: "bg-[oklch(0.96_0.02_30)] text-[oklch(0.5_0.12_30)]",
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs tabular-nums ${map[status] ?? "bg-[oklch(0.96_0.02_95)] text-subtle"}`}>
      {status}
    </span>
  );
}
