import { getDatabase } from '../db'

export interface Workflow {
  id?: number
  name: string
  description: string
  trigger_type: 'manual' | 'scheduled' | 'webhook' | 'event'
  trigger_condition: string
  status: 'active' | 'paused' | 'archived'
  created_by: string
  created_at?: string
  updated_at?: string
}

export interface WorkflowTask {
  id?: number
  workflow_id: number
  step_order: number
  agent: string
  action: string
  parameters?: Record<string, any>
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  duration_seconds?: number
  created_at?: string
}

export interface Integration {
  id?: number
  name: string
  type: 'zapier' | 'webhook' | 'api' | 'database' | 'tool'
  provider: string
  status: 'configured' | 'testing' | 'active' | 'error'
  config: Record<string, any>
  last_sync?: string
  created_at?: string
}

export function createWorkflow(workflow: Workflow): number {
  const db = getDatabase()
  const result = db.prepare(
    `INSERT INTO workflows (name, description, trigger_type, trigger_condition, status, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    workflow.name,
    workflow.description,
    workflow.trigger_type,
    workflow.trigger_condition,
    workflow.status || 'active',
    workflow.created_by,
    new Date().toISOString(),
    new Date().toISOString()
  )
  return result.lastInsertRowid || 0
}

export function addWorkflowTask(task: WorkflowTask): number {
  const db = getDatabase()
  const result = db.prepare(
    `INSERT INTO workflow_tasks (workflow_id, step_order, agent, action, parameters, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    task.workflow_id,
    task.step_order,
    task.agent,
    task.action,
    JSON.stringify(task.parameters || {}),
    task.status || 'pending',
    new Date().toISOString()
  )
  return result.lastInsertRowid || 0
}

export function updateWorkflowTaskStatus(taskId: number, status: 'pending' | 'running' | 'completed' | 'failed', result?: string, duration?: number): void {
  const db = getDatabase()
  db.prepare('UPDATE workflow_tasks SET status = ?, result = ?, duration_seconds = ? WHERE id = ?').run(status, result || '', duration || 0, taskId)
}

export function getWorkflows(status?: string): Workflow[] {
  const db = getDatabase()
  if (status) {
    return db.prepare('SELECT * FROM workflows WHERE status = ? ORDER BY created_at DESC').all(status)
  }
  return db.prepare('SELECT * FROM workflows ORDER BY created_at DESC').all()
}

export function getWorkflow(id: number): Workflow | null {
  const db = getDatabase()
  return db.prepare('SELECT * FROM workflows WHERE id = ?').get(id) || null
}

export function getWorkflowTasks(workflowId: number): WorkflowTask[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM workflow_tasks WHERE workflow_id = ? ORDER BY step_order').all(workflowId)
}

export function updateWorkflowStatus(workflowId: number, status: 'active' | 'paused' | 'archived'): void {
  const db = getDatabase()
  db.prepare('UPDATE workflows SET status = ?, updated_at = ? WHERE id = ?').run(status, new Date().toISOString(), workflowId)
}

export function deleteWorkflow(workflowId: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM workflow_tasks WHERE workflow_id = ?').run(workflowId)
  db.prepare('DELETE FROM workflows WHERE id = ?').run(workflowId)
}

export function registerIntegration(integration: Integration): number {
  const db = getDatabase()
  const result = db.prepare(
    `INSERT INTO integrations (name, type, provider, status, config, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    integration.name,
    integration.type,
    integration.provider,
    integration.status || 'configured',
    JSON.stringify(integration.config || {}),
    new Date().toISOString()
  )
  return result.lastInsertRowid || 0
}

export function getIntegrations(): Integration[] {
  const db = getDatabase()
  const integrations = db.prepare('SELECT * FROM integrations ORDER BY created_at DESC').all()
  return integrations.map((i: any) => ({
    ...i,
    config: JSON.parse(i.config || '{}'),
  }))
}

export function getIntegration(id: number): Integration | null {
  const db = getDatabase()
  const integration = db.prepare('SELECT * FROM integrations WHERE id = ?').get(id)
  if (!integration) return null
  return {
    ...integration,
    config: JSON.parse(integration.config || '{}'),
  }
}

export function updateIntegrationStatus(integrationId: number, status: string): void {
  const db = getDatabase()
  db.prepare('UPDATE integrations SET status = ?, last_sync = ? WHERE id = ?').run(status, new Date().toISOString(), integrationId)
}

export function getRecentWorkflowExecutions(limit: number = 10) {
  const db = getDatabase()
  return db.prepare(`
    SELECT w.id, w.name, wt.status, COUNT(*) as task_count, MAX(wt.created_at) as last_run
    FROM workflows w
    LEFT JOIN workflow_tasks wt ON w.id = wt.workflow_id
    GROUP BY w.id
    ORDER BY last_run DESC
    LIMIT ?
  `).all(limit)
}

export function getWorkflowStats() {
  const db = getDatabase()
  const totalWorkflows = db.prepare('SELECT COUNT(*) as count FROM workflows').get()
  const activeWorkflows = db.prepare("SELECT COUNT(*) as count FROM workflows WHERE status = 'active'").get()
  const completedTasks = db.prepare("SELECT COUNT(*) as count FROM workflow_tasks WHERE status = 'completed'").get()
  const failedTasks = db.prepare("SELECT COUNT(*) as count FROM workflow_tasks WHERE status = 'failed'").get()

  return {
    total_workflows: totalWorkflows?.count || 0,
    active_workflows: activeWorkflows?.count || 0,
    completed_tasks: completedTasks?.count || 0,
    failed_tasks: failedTasks?.count || 0,
  }
}
