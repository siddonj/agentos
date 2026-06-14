import { getDatabase } from '../db'

export interface ActivityLogEntry {
  id: number
  timestamp: string
  agent: string
  action: string
  task_id?: number
  duration_seconds?: number
  status: 'success' | 'error' | 'warning'
  cost?: number
  error?: string
}

export async function logActivity(params: {
  agent: string
  action: string
  task_id?: number
  duration_seconds?: number
  status?: 'success' | 'error' | 'warning'
  cost?: number
  error?: string
}): Promise<ActivityLogEntry> {
  const db = getDatabase()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO activity_log (
      timestamp,
      agent,
      action,
      task_id,
      duration_seconds,
      status,
      cost,
      error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const info = stmt.run(
    now,
    params.agent,
    params.action,
    params.task_id || null,
    params.duration_seconds || null,
    params.status || 'success',
    params.cost || null,
    params.error || null
  )

  return {
    id: info.lastInsertRowid as number,
    timestamp: now,
    agent: params.agent,
    action: params.action,
    task_id: params.task_id,
    duration_seconds: params.duration_seconds,
    status: params.status || 'success',
    cost: params.cost,
    error: params.error,
  }
}

export function getActivityLog(
  filter?: {
    agent?: string
    days?: number
    limit?: number
  }
): ActivityLogEntry[] {
  const db = getDatabase()

  let query = 'SELECT * FROM activity_log WHERE 1=1'
  const params: any[] = []

  if (filter?.agent) {
    query += ' AND agent = ?'
    params.push(filter.agent)
  }

  if (filter?.days) {
    query += ` AND timestamp >= datetime('now', '-${filter.days} days')`
  }

  query += ' ORDER BY timestamp DESC'

  if (filter?.limit) {
    query += ' LIMIT ?'
    params.push(filter.limit)
  }

  const stmt = db.prepare(query)
  const rows = stmt.all(...params) as any[]

  return rows.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    agent: row.agent,
    action: row.action,
    task_id: row.task_id,
    duration_seconds: row.duration_seconds,
    status: row.status,
    cost: row.cost,
    error: row.error,
  }))
}

export function getActivityLogByAgent(
  agent: string,
  days: number = 7,
  limit: number = 100
): ActivityLogEntry[] {
  return getActivityLog({ agent, days, limit })
}

export function getTotalCost(filter?: {
  agent?: string
  days?: number
}): number {
  const db = getDatabase()

  let query = 'SELECT SUM(COALESCE(cost, 0)) as total FROM activity_log WHERE 1=1'
  const params: any[] = []

  if (filter?.agent) {
    query += ' AND agent = ?'
    params.push(filter.agent)
  }

  if (filter?.days) {
    query += ` AND timestamp >= datetime('now', '-${filter.days} days')`
  }

  const stmt = db.prepare(query)
  const row = stmt.get(...params) as any

  return row?.total || 0
}

export function getErrorsSinceTime(since_minutes: number = 60): ActivityLogEntry[] {
  const db = getDatabase()

  const stmt = db.prepare(`
    SELECT * FROM activity_log
    WHERE status = 'error'
      AND timestamp >= datetime('now', '-${since_minutes} minutes')
    ORDER BY timestamp DESC
  `)

  const rows = stmt.all() as any[]

  return rows.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    agent: row.agent,
    action: row.action,
    task_id: row.task_id,
    duration_seconds: row.duration_seconds,
    status: row.status,
    cost: row.cost,
    error: row.error,
  }))
}
