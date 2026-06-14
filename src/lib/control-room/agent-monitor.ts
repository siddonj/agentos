import { getDatabase } from '../db'

export interface AgentStatus {
  agent: string
  status: 'idle' | 'working' | 'researching' | 'drafting' | 'publishing' | 'analyzing' | 'error'
  current_task?: string
  last_updated: string
  metadata?: Record<string, any>
}

export async function reportAgentStatus(
  agent: string,
  status: AgentStatus['status'],
  metadata?: Record<string, any>
): Promise<AgentStatus> {
  const db = getDatabase()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO agent_status (agent, status, last_updated, metadata)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(agent) DO UPDATE SET
      status = excluded.status,
      last_updated = excluded.last_updated,
      metadata = excluded.metadata
  `)

  stmt.run(agent, status, now, metadata ? JSON.stringify(metadata) : null)

  return {
    agent,
    status,
    current_task: metadata?.current_task,
    last_updated: now,
    metadata,
  }
}

export function getAgentStatus(agent: string): AgentStatus | null {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT agent, status, current_task, last_updated, metadata
    FROM agent_status
    WHERE agent = ?
  `)

  const row = stmt.get(agent) as any
  if (!row) return null

  return {
    agent: row.agent,
    status: row.status,
    current_task: row.current_task,
    last_updated: row.last_updated,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  }
}

export function getAllAgentStatuses(): AgentStatus[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT agent, status, current_task, last_updated, metadata
    FROM agent_status
    ORDER BY last_updated DESC
  `)

  const rows = stmt.all() as any[]
  return rows.map((row) => ({
    agent: row.agent,
    status: row.status,
    current_task: row.current_task,
    last_updated: row.last_updated,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  }))
}

export function initializeAgents(): void {
  const agents = ['Claude', 'Hermes', 'Zapier', 'Learning']
  for (const agent of agents) {
    reportAgentStatus(agent, 'idle')
  }
}
