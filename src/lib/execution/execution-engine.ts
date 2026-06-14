import { getDatabase } from '../db'

export interface ExecutionQueueItem {
  id?: number
  task_id: number
  workflow_id?: number
  priority?: number
  status: 'queued' | 'running' | 'completed' | 'failed'
  assigned_agent?: string
  queued_at?: string
  started_at?: string
  completed_at?: string
  retry_count?: number
  max_retries?: number
  error_message?: string
}

export interface ExecutionLog {
  id?: number
  execution_queue_id: number
  timestamp?: string
  event_type: 'queued' | 'started' | 'progress' | 'completed' | 'failed' | 'retrying'
  status?: string
  message: string
  metrics?: Record<string, any>
}

export interface ResourceAllocation {
  id?: number
  agent: string
  allocated_at?: string
  max_concurrent_tasks: number
  current_tasks: number
  cpu_usage: number
  memory_usage: number
  status: 'available' | 'busy' | 'overloaded'
}

export function enqueueTask(taskId: number, priority: number = 5, workflowId?: number): number {
  const db = getDatabase()
  const result = db.prepare(
    `INSERT INTO execution_queue (task_id, workflow_id, priority, status, queued_at)
     VALUES (?, ?, ?, 'queued', ?)`
  ).run(taskId, workflowId || null, priority, new Date().toISOString())

  const queueId = result.lastInsertRowid || 0
  logExecution(queueId, 'queued', 'queued', `Task ${taskId} enqueued with priority ${priority}`)

  return queueId
}

export function dequeueNextTask(): ExecutionQueueItem | null {
  const db = getDatabase()
  const next = db
    .prepare(
      `SELECT * FROM execution_queue
       WHERE status = 'queued'
       ORDER BY priority DESC, queued_at ASC
       LIMIT 1`
    )
    .get()

  return next || null
}

export function assignTaskToAgent(queueId: number, agent: string): void {
  const db = getDatabase()
  db.prepare('UPDATE execution_queue SET assigned_agent = ?, status = ? WHERE id = ?').run(agent, 'assigned', queueId)
  logExecution(queueId, 'assigned', 'queued', `Task assigned to agent: ${agent}`)
}

export function startTaskExecution(queueId: number): void {
  const db = getDatabase()
  db.prepare('UPDATE execution_queue SET status = ?, started_at = ? WHERE id = ?').run('running', new Date().toISOString(), queueId)
  logExecution(queueId, 'started', 'running', 'Task execution started')
}

export function completeTaskExecution(queueId: number, result?: string): void {
  const db = getDatabase()
  db.prepare('UPDATE execution_queue SET status = ?, completed_at = ? WHERE id = ?').run('completed', new Date().toISOString(), queueId)
  logExecution(queueId, 'completed', 'completed', `Task completed successfully`, {
    result: result || 'success',
  })
}

export function failTaskExecution(queueId: number, error: string): void {
  const db = getDatabase()
  const item = db.prepare('SELECT * FROM execution_queue WHERE id = ?').get(queueId)

  if (!item) return

  const retryCount = (item.retry_count || 0) + 1
  const maxRetries = item.max_retries || 3

  if (retryCount < maxRetries) {
    db.prepare('UPDATE execution_queue SET status = ?, retry_count = ? WHERE id = ?').run('queued', retryCount, queueId)
    logExecution(queueId, 'retrying', 'queued', `Task failed: ${error}. Retry ${retryCount}/${maxRetries}`)
  } else {
    db.prepare('UPDATE execution_queue SET status = ?, error_message = ? WHERE id = ?').run('failed', error, queueId)
    logExecution(queueId, 'failed', 'failed', `Task failed permanently: ${error}`)
  }
}

export function logExecution(queueId: number, eventType: string, status: string, message: string, metrics?: Record<string, any>): void {
  const db = getDatabase()
  db.prepare(
    `INSERT INTO execution_logs (execution_queue_id, event_type, status, message, metrics, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(queueId, eventType, status, message, JSON.stringify(metrics || {}), new Date().toISOString())
}

export function getExecutionQueue(status?: string): ExecutionQueueItem[] {
  const db = getDatabase()
  if (status) {
    return db.prepare(`SELECT * FROM execution_queue WHERE status = ? ORDER BY priority DESC, queued_at ASC`).all(status)
  }
  return db.prepare(`SELECT * FROM execution_queue ORDER BY priority DESC, queued_at ASC`).all()
}

export function getExecutionLogs(queueId: number): ExecutionLog[] {
  const db = getDatabase()
  return db.prepare(`SELECT * FROM execution_logs WHERE execution_queue_id = ? ORDER BY timestamp DESC`).all(queueId)
}

export function getQueueStats() {
  const db = getDatabase()
  const queued = db.prepare(`SELECT COUNT(*) as count FROM execution_queue WHERE status = 'queued'`).get()
  const running = db.prepare(`SELECT COUNT(*) as count FROM execution_queue WHERE status = 'running'`).get()
  const completed = db.prepare(`SELECT COUNT(*) as count FROM execution_queue WHERE status = 'completed'`).get()
  const failed = db.prepare(`SELECT COUNT(*) as count FROM execution_queue WHERE status = 'failed'`).get()

  const avgDuration = db.prepare(
    `SELECT AVG(julianday(completed_at) - julianday(started_at)) * 86400 as avg_seconds FROM execution_queue WHERE status = 'completed'`
  ).get()

  return {
    queued: queued?.count || 0,
    running: running?.count || 0,
    completed: completed?.count || 0,
    failed: failed?.count || 0,
    avg_duration_seconds: Math.round((avgDuration?.avg_seconds || 0) * 10) / 10,
  }
}

export function allocateResources(agent: string, maxConcurrent: number = 3): number {
  const db = getDatabase()
  const existing = db.prepare(`SELECT * FROM resource_allocations WHERE agent = ?`).get(agent)

  if (existing) {
    return existing.id
  }

  const result = db.prepare(
    `INSERT INTO resource_allocations (agent, max_concurrent_tasks, current_tasks, status, allocated_at)
     VALUES (?, ?, 0, 'available', ?)`
  ).run(agent, maxConcurrent, new Date().toISOString())

  return result.lastInsertRowid || 0
}

export function getResourceAllocations(): ResourceAllocation[] {
  const db = getDatabase()
  return db.prepare(`SELECT * FROM resource_allocations ORDER BY agent`).all()
}

export function updateResourceUsage(agent: string, currentTasks: number, cpuUsage: number, memoryUsage: number): void {
  const db = getDatabase()
  const status = currentTasks === 0 ? 'available' : currentTasks > 5 ? 'overloaded' : 'busy'
  db.prepare('UPDATE resource_allocations SET current_tasks = ?, cpu_usage = ?, memory_usage = ?, status = ? WHERE agent = ?').run(
    currentTasks,
    cpuUsage,
    memoryUsage,
    status,
    agent
  )
}

export function getAvailableAgent(): string | null {
  const db = getDatabase()
  const agent = db.prepare(`SELECT * FROM resource_allocations WHERE status = 'available' ORDER BY current_tasks ASC LIMIT 1`).get()
  return agent ? agent.agent : null
}

export function getExecutionDashboardData() {
  const stats = getQueueStats()
  const queue = getExecutionQueue()
  const resources = getResourceAllocations()

  const db = getDatabase()
  const topExecutions = db.prepare(`SELECT * FROM execution_queue ORDER BY completed_at DESC LIMIT 10`).all()

  return {
    stats,
    queue: queue.slice(0, 5),
    resources,
    recent_executions: topExecutions,
  }
}

// Initialize default resource allocations for all agents
export function initializeDefaultResources() {
  const agents = ['Claude', 'Hermes', 'Zapier', 'Learning']
  agents.forEach((agent) => {
    allocateResources(agent, 3)
  })
}
