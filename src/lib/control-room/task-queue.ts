import { getDatabase } from '../db'

export interface Task {
  id: number
  created_at: string
  started_at?: string
  completed_at?: string
  agent: string
  task_type: string
  description?: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  result?: string
  duration_seconds?: number
}

export async function createTask(params: {
  agent: string
  task_type: string
  description?: string
}): Promise<Task> {
  const db = getDatabase()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO tasks (created_at, agent, task_type, description, status)
    VALUES (?, ?, ?, ?, 'pending')
  `)

  const info = stmt.run(now, params.agent, params.task_type, params.description)

  return {
    id: info.lastInsertRowid as number,
    created_at: now,
    agent: params.agent,
    task_type: params.task_type,
    description: params.description,
    status: 'pending',
  }
}

export function updateTaskStatus(
  task_id: number,
  status: Task['status'],
  result?: string
): Task | null {
  const db = getDatabase()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    UPDATE tasks
    SET status = ?,
        started_at = CASE WHEN ? = 'in-progress' AND started_at IS NULL THEN ? ELSE started_at END,
        completed_at = CASE WHEN ? IN ('completed', 'failed') THEN ? ELSE completed_at END,
        result = ?
    WHERE id = ?
    RETURNING *
  `)

  const row = stmt.get(status, status, now, status, now, result, task_id) as any
  if (!row) return null

  return {
    id: row.id,
    created_at: row.created_at,
    started_at: row.started_at,
    completed_at: row.completed_at,
    agent: row.agent,
    task_type: row.task_type,
    description: row.description,
    status: row.status,
    result: row.result,
  }
}

export function getTask(task_id: number): Task | null {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?')

  const row = stmt.get(task_id) as any
  if (!row) return null

  return {
    id: row.id,
    created_at: row.created_at,
    started_at: row.started_at,
    completed_at: row.completed_at,
    agent: row.agent,
    task_type: row.task_type,
    description: row.description,
    status: row.status,
    result: row.result,
  }
}

export function getTasks(filter?: {
  status?: string
  agent?: string
  limit?: number
}): Task[] {
  const db = getDatabase()

  let query = 'SELECT * FROM tasks WHERE 1=1'
  const params: any[] = []

  if (filter?.status) {
    query += ' AND status = ?'
    params.push(filter.status)
  }

  if (filter?.agent) {
    query += ' AND agent = ?'
    params.push(filter.agent)
  }

  query += ' ORDER BY created_at DESC'

  if (filter?.limit) {
    query += ' LIMIT ?'
    params.push(filter.limit)
  }

  const stmt = db.prepare(query)
  const rows = stmt.all(...params) as any[]

  return rows.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    started_at: row.started_at,
    completed_at: row.completed_at,
    agent: row.agent,
    task_type: row.task_type,
    description: row.description,
    status: row.status,
    result: row.result,
  }))
}

export function getTasksByAgent(agent: string, limit: number = 50): Task[] {
  return getTasks({ agent, limit })
}

export function getPendingTasks(): Task[] {
  return getTasks({ status: 'pending' })
}

export function getInProgressTasks(): Task[] {
  return getTasks({ status: 'in-progress' })
}

export function getTaskMetrics(agent: string): {
  total: number
  completed: number
  failed: number
  pending: number
  success_rate: number
  avg_duration: number
} {
  const db = getDatabase()

  const stmt = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      AVG(CAST((julianday(completed_at) - julianday(started_at)) * 86400 AS INTEGER)) as avg_duration
    FROM tasks
    WHERE agent = ?
  `)

  const row = stmt.get(agent) as any

  const total = row.total || 0
  const completed = row.completed || 0
  const success_rate = total > 0 ? completed / total : 0

  return {
    total,
    completed,
    failed: row.failed || 0,
    pending: row.pending || 0,
    success_rate,
    avg_duration: row.avg_duration || 0,
  }
}
