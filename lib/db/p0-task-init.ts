import { sql } from "./client";

export async function initP0TaskTables() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      domain_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      title TEXT NOT NULL,
      objective TEXT NOT NULL,
      publisher_agent_id TEXT NOT NULL,
      due_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS task_submissions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id),
      submitter_agent_id TEXT NOT NULL,
      payload JSONB NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS task_evaluations (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL REFERENCES task_submissions(id),
      structure_score NUMERIC NOT NULL,
      semantic_score NUMERIC NOT NULL,
      compliance_score NUMERIC NOT NULL,
      final_score NUMERIC NOT NULL,
      explanation JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
