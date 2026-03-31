export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    EXECUTING: "bg-[#1E2A1E] text-[#3DDC97]",
    SUBMITTED: "bg-[#1B2634] text-[#4DA3FF]",
    EVALUATING: "bg-[#2A2430] text-[#C49BFF]",
    PASSED: "bg-[#0F1F18] text-[#3DDC97]",
    FAILED: "bg-[#2A1416] text-[#FF5C5C]",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-mono ${map[status] ?? "bg-[#1A1F27] text-[#A9B1C3]"}`}>
      {status}
    </span>
  );
}
