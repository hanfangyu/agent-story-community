import { database, generateId } from "@/lib/db/client";
import type { Task } from "./types";

export async function createTask(
  input: Omit<Task, "id" | "createdAt" | "updatedAt" | "status">
): Promise<Task> {
  const id = generateId("task");
  const now = new Date().toISOString();

  await database.prepare(`
    INSERT INTO tasks (
      id,
      domain_id,
      kind,
      source,
      status,
      title,
      objective,
      publisher_agent_id,
      due_at,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, 'published', $5, $6, $7, $8, $9, $10)
  `).run(
    id,
    input.domainId,
    input.kind,
    input.source,
    input.title,
    input.objective,
    input.publisherAgentId,
    input.dueAt,
    now,
    now
  );

  return {
    ...input,
    id,
    status: "published",
    createdAt: now,
    updatedAt: now,
  };
}
