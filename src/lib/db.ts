import path from 'path'
import { existsSync } from 'fs'
import { getConfig } from './config'

let db: any = null

export function initializeDatabase(): any {
  if (db) return db

  // Create simple in-memory database mock
  db = createMockDatabase()

  // Initialize schema
  createSchema(db)

  return db
}

function createMockDatabase(): any {
  const tables: Record<string, any[]> = {
    activities: [],
    analytics: [],
    patterns: [],
    tasks: [],
    activity_log: [],
    agent_status: [],
    agent_metrics: [],
    authority_metrics: [],
    media_mentions: [],
    speaking_events: [],
    workflows: [],
    workflow_tasks: [],
    integrations: [],
    execution_queue: [],
    execution_logs: [],
    resource_allocations: [],
    strategic_plans: [],
    performance_forecasts: [],
    recommendations: [],
  }

  let idCounters: Record<string, number> = {
    activities: 0,
    analytics: 0,
    patterns: 0,
    tasks: 0,
    activity_log: 0,
    agent_status: 0,
    agent_metrics: 0,
    authority_metrics: 0,
    media_mentions: 0,
    speaking_events: 0,
    workflows: 0,
    workflow_tasks: 0,
    integrations: 0,
    execution_queue: 0,
    execution_logs: 0,
    resource_allocations: 0,
    strategic_plans: 0,
    performance_forecasts: 0,
    recommendations: 0,
  }

  return {
    prepare: (sql: string) => {
      return {
        run: (...params: any[]) => {
          const result = executeInsert(sql, params, tables, idCounters)
          return { lastInsertRowid: result }
        },
        all: (...params: any[]) => executeSelect(sql, params, tables),
        get: (...params: any[]) => {
          const results = executeSelect(sql, params, tables)
          return results[0] || null
        },
      }
    },
    pragma: () => {},
  }
}

function executeInsert(sql: string, params: any[], tables: Record<string, any[]>, counters: Record<string, number>): number {
  const match = sql.match(/INSERT INTO (\w+)/i)
  if (!match) return 0

  const tableName = match[1]
  if (!tables[tableName]) tables[tableName] = []

  const id = ++counters[tableName]
  const columns = sql.match(/\(([^)]+)\)/)?.[1]?.split(',').map(c => c.trim()) || []

  const row: any = { id }
  columns.forEach((col, i) => {
    if (col !== 'id') row[col] = params[i]
  })

  tables[tableName].push(row)
  return id
}

function executeSelect(sql: string, params: any[], tables: Record<string, any[]>): any[] {
  const fromMatch = sql.match(/FROM (\w+)/i)
  if (!fromMatch) return []

  const tableName = fromMatch[1]
  let rows = tables[tableName] || []

  // Simple WHERE clause handling
  if (sql.includes('WHERE')) {
    const whereMatch = sql.match(/WHERE\s+([^O]+?)(?:ORDER|$)/i)
    if (whereMatch) {
      const whereClause = whereMatch[1].trim()
      rows = rows.filter((row) => {
        if (whereClause.includes('=')) {
          const [col, _] = whereClause.split('=').map(s => s.trim())
          return row[col] === params[0]
        }
        return true
      })
    }
  }

  return rows
}

function createSchema(database: Database.Database): void {
  // Phase 1: Learning System
  database.prepare(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      agent TEXT,
      task_type TEXT,
      content_type TEXT,
      topic TEXT,
      channel TEXT,
      status TEXT,
      result TEXT
    )
  `).run()

  database.prepare(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      content_type TEXT,
      topic TEXT,
      channel TEXT,
      impressions INTEGER DEFAULT 0,
      engagement_rate REAL DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      new_followers INTEGER DEFAULT 0,
      updated_at TEXT
    )
  `).run()

  database.prepare(`
    CREATE TABLE IF NOT EXISTS patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern_type TEXT,
      insight TEXT,
      data TEXT,
      confidence REAL,
      sample_size INTEGER,
      created_date TEXT
    )
  `).run()

  // Phase 2: Agent Control Room
  database.prepare(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      started_at TEXT,
      completed_at TEXT,
      agent TEXT NOT NULL,
      task_type TEXT,
      description TEXT,
      status TEXT DEFAULT 'pending',
      result TEXT
    )
  `).run()

  database.prepare(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      agent TEXT NOT NULL,
      action TEXT NOT NULL,
      task_id INTEGER,
      duration_seconds INTEGER,
      status TEXT,
      cost REAL,
      error TEXT,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )
  `).run()

  database.prepare(`
    CREATE TABLE IF NOT EXISTS agent_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'idle',
      current_task TEXT,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT
    )
  `).run()

  database.prepare(`
    CREATE TABLE IF NOT EXISTS agent_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      agent TEXT NOT NULL,
      tasks_completed INTEGER DEFAULT 0,
      avg_duration_seconds REAL DEFAULT 0,
      success_rate REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      UNIQUE(date, agent)
    )
  `).run()

  // Phase 3: Authority Dashboard
  database.prepare(`
    CREATE TABLE IF NOT EXISTS authority_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      followers INTEGER DEFAULT 0,
      reach INTEGER DEFAULT 0,
      mentions INTEGER DEFAULT 0,
      engagement_rate REAL DEFAULT 0,
      authority_score REAL DEFAULT 0,
      speaking_events_count INTEGER DEFAULT 0,
      media_mentions_count INTEGER DEFAULT 0,
      updated_at TEXT
    )
  `).run()

  database.prepare(`
    CREATE TABLE IF NOT EXISTS media_mentions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date_published TEXT NOT NULL,
      title TEXT NOT NULL,
      outlet TEXT NOT NULL,
      mention_type TEXT,
      url TEXT,
      reach INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  database.prepare(`
    CREATE TABLE IF NOT EXISTS speaking_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT NOT NULL,
      event_date TEXT NOT NULL,
      event_type TEXT,
      platform TEXT,
      audience_size INTEGER DEFAULT 0,
      topic TEXT,
      status TEXT DEFAULT 'scheduled',
      recording_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  // Phase 4: Command Center
  database.prepare(`
    CREATE TABLE IF NOT EXISTS workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      trigger_type TEXT,
      trigger_condition TEXT,
      status TEXT DEFAULT 'active',
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  database.prepare(`
    CREATE TABLE IF NOT EXISTS workflow_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id INTEGER NOT NULL,
      step_order INTEGER NOT NULL,
      agent TEXT NOT NULL,
      action TEXT NOT NULL,
      parameters TEXT,
      status TEXT DEFAULT 'pending',
      result TEXT,
      duration_seconds INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id)
    )
  `).run()

  database.prepare(`
    CREATE TABLE IF NOT EXISTS integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      provider TEXT,
      status TEXT DEFAULT 'configured',
      config TEXT,
      last_sync TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  // Phase 5: Parallel Execution
  database.prepare(`
    CREATE TABLE IF NOT EXISTS execution_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      workflow_id INTEGER,
      priority INTEGER DEFAULT 5,
      status TEXT DEFAULT 'queued',
      assigned_agent TEXT,
      queued_at TEXT DEFAULT CURRENT_TIMESTAMP,
      started_at TEXT,
      completed_at TEXT,
      retry_count INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 3,
      error_message TEXT
    )
  `).run()

  database.prepare(`
    CREATE TABLE IF NOT EXISTS execution_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      execution_queue_id INTEGER NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      event_type TEXT NOT NULL,
      status TEXT,
      message TEXT,
      metrics TEXT,
      FOREIGN KEY (execution_queue_id) REFERENCES execution_queue(id)
    )
  `).run()

  database.prepare(`
    CREATE TABLE IF NOT EXISTS resource_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent TEXT NOT NULL,
      allocated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      max_concurrent_tasks INTEGER DEFAULT 3,
      current_tasks INTEGER DEFAULT 0,
      cpu_usage REAL DEFAULT 0,
      memory_usage REAL DEFAULT 0,
      status TEXT DEFAULT 'available'
    )
  `).run()

  // Phase 6: Analytics + Planning
  database.prepare(`
    CREATE TABLE IF NOT EXISTS strategic_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      objective TEXT NOT NULL,
      timeline_days INTEGER,
      target_metrics TEXT,
      status TEXT DEFAULT 'active',
      priority INTEGER DEFAULT 5,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  database.prepare(`
    CREATE TABLE IF NOT EXISTS performance_forecasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric_name TEXT NOT NULL,
      forecast_date TEXT NOT NULL,
      predicted_value REAL,
      confidence_level REAL,
      trend TEXT,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  database.prepare(`
    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      impact_score REAL DEFAULT 0,
      implementation_effort TEXT,
      status TEXT DEFAULT 'suggested',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run()
}

export function getDatabase(): any {
  if (!db) {
    initializeDatabase()
  }
  return db!
}

export function closeDatabase(): void {
  db = null
}
