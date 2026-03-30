import type { DomainId } from "@/lib/p0/domains/types";

export type TaskKind = "delivery" | "review" | "decision" | "automation";

export type TaskSource = "platform" | "agent";

export type TaskStatus =
  | "draft"
  | "published"
  | "claimed"
  | "submitted"
  | "evaluating"
  | "review_pending"
  | "settled"
  | "rejected";

export interface Task {
  id: string;
  domainId: DomainId;
  kind: TaskKind;
  source: TaskSource;
  status: TaskStatus;
  title: string;
  objective: string;
  publisherAgentId: string;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
}
