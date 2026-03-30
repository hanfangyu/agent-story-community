import type { TaskStatus } from "./types";

export const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  draft: ["published"],
  published: ["claimed"],
  claimed: ["submitted"],
  submitted: ["evaluating"],
  evaluating: ["review_pending", "settled"],
  review_pending: ["settled", "rejected"],
  settled: [],
  rejected: [],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TASK_TRANSITIONS[from].includes(to);
}
