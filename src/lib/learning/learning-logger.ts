import { getDatabase } from '../db'
import { promises as fs } from 'fs'
import path from 'path'
import { getConfig } from '../config'

export interface ActivityLog {
  agent: string
  task_type: string
  content_type: string
  topic?: string
  channel?: string
  status: 'success' | 'failed' | 'partial'
  result?: Record<string, any>
}

export interface SavedActivity extends ActivityLog {
  id: number
  timestamp: string
}

export async function logActivity(activity: ActivityLog): Promise<SavedActivity> {
  const timestamp = new Date().toISOString()
  const db = getDatabase()

  const stmt = db.prepare(`
    INSERT INTO activities (
      timestamp,
      agent,
      task_type,
      content_type,
      topic,
      channel,
      status,
      result
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const info = stmt.run(
    timestamp,
    activity.agent,
    activity.task_type,
    activity.content_type,
    activity.topic || null,
    activity.channel || null,
    activity.status,
    activity.result ? JSON.stringify(activity.result) : null
  )

  await saveActivityToVault(activity, timestamp)

  return {
    id: info.lastInsertRowid as number,
    timestamp,
    ...activity,
  }
}

export function getActivities(startDate: Date, endDate: Date): SavedActivity[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT
      id,
      timestamp,
      agent,
      task_type,
      content_type,
      topic,
      channel,
      status,
      result
    FROM activities
    WHERE timestamp >= ? AND timestamp <= ?
    ORDER BY timestamp DESC
  `)

  const rows = stmt.all(startDate.toISOString(), endDate.toISOString()) as any[]

  return rows.map((row) => ({
    ...row,
    result: row.result ? JSON.parse(row.result) : null,
  }))
}

export function getActivitiesByAgent(agent: string, days: number = 30): SavedActivity[] {
  const db = getDatabase()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const stmt = db.prepare(`
    SELECT
      id,
      timestamp,
      agent,
      task_type,
      content_type,
      topic,
      channel,
      status,
      result
    FROM activities
    WHERE agent = ? AND timestamp >= ?
    ORDER BY timestamp DESC
  `)

  const rows = stmt.all(agent, startDate.toISOString()) as any[]

  return rows.map((row) => ({
    ...row,
    result: row.result ? JSON.parse(row.result) : null,
  }))
}

export function getActivitiesByTopic(topic: string, days: number = 30): SavedActivity[] {
  const db = getDatabase()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const stmt = db.prepare(`
    SELECT
      id,
      timestamp,
      agent,
      task_type,
      content_type,
      topic,
      channel,
      status,
      result
    FROM activities
    WHERE topic = ? AND timestamp >= ?
    ORDER BY timestamp DESC
  `)

  const rows = stmt.all(topic, startDate.toISOString()) as any[]

  return rows.map((row) => ({
    ...row,
    result: row.result ? JSON.parse(row.result) : null,
  }))
}

export function getSuccessfulActivities(days: number = 30): SavedActivity[] {
  const db = getDatabase()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const stmt = db.prepare(`
    SELECT
      id,
      timestamp,
      agent,
      task_type,
      content_type,
      topic,
      channel,
      status,
      result
    FROM activities
    WHERE status = 'success' AND timestamp >= ?
    ORDER BY timestamp DESC
  `)

  const rows = stmt.all(startDate.toISOString()) as any[]

  return rows.map((row) => ({
    ...row,
    result: row.result ? JSON.parse(row.result) : null,
  }))
}

export function aggregateToAnalytics(): void {
  const db = getDatabase()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const stmt = db.prepare(`
    SELECT
      content_type,
      topic,
      channel,
      result
    FROM activities
    WHERE DATE(timestamp) = ? AND status = 'success'
  `)

  const activities = stmt.all(todayStr) as any[]

  if (activities.length === 0) return

  const grouped: Record<string, any[]> = {}

  for (const activity of activities) {
    const key = `${activity.content_type}|${activity.topic}|${activity.channel}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(activity)
  }

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO analytics (
      date,
      content_type,
      topic,
      channel,
      impressions,
      engagement_rate,
      clicks,
      shares,
      comments,
      likes,
      new_followers,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const [key, items] of Object.entries(grouped)) {
    const [content_type, topic, channel] = key.split('|')

    let totalImpressions = 0
    let totalEngagement = 0
    let totalClicks = 0
    let totalShares = 0
    let totalComments = 0
    let totalLikes = 0
    let totalFollowers = 0

    for (const activity of items) {
      const result = JSON.parse(activity.result || '{}')
      totalImpressions += result.impressions || 0
      totalClicks += result.clicks || 0
      totalShares += result.shares || 0
      totalComments += result.comments || 0
      totalLikes += result.likes || 0
      totalFollowers += result.new_followers || 0
      totalEngagement += result.engagement || 0
    }

    const avgEngagement = totalImpressions > 0 ? totalEngagement / items.length : 0

    insertStmt.run(
      todayStr,
      content_type,
      topic,
      channel,
      totalImpressions,
      avgEngagement,
      totalClicks,
      totalShares,
      totalComments,
      totalLikes,
      totalFollowers,
      new Date().toISOString()
    )
  }
}

async function saveActivityToVault(activity: ActivityLog, timestamp: string): Promise<void> {
  const config = getConfig()
  const date = new Date(timestamp)
  const dateStr = date.toISOString().split('T')[0]

  const vaultPath = path.join(config.vaultRoot, 'analytics/daily')

  try {
    await fs.mkdir(vaultPath, { recursive: true })
  } catch {
    // Directory exists
  }

  const filePath = path.join(vaultPath, `${dateStr}.md`)

  let content = ''
  try {
    content = await fs.readFile(filePath, 'utf-8')
  } catch {
    content = `# Activities — ${dateStr}\n\n`
  }

  const activityLine = `- **${activity.agent}** [${activity.task_type}] ${activity.content_type}`
  const detailsLine = `  - Topic: ${activity.topic || 'N/A'}, Channel: ${activity.channel || 'N/A'}, Status: ${activity.status}`

  content += `\n${activityLine}\n${detailsLine}`

  await fs.writeFile(filePath, content, 'utf-8')
}

export function exportActivities(days: number = 30): string {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const activities = getActivities(startDate, new Date())

  let csv =
    'timestamp,agent,task_type,content_type,topic,channel,status,impressions,engagement\n'

  for (const activity of activities) {
    const result = activity.result || {}
    csv += `"${activity.timestamp}","${activity.agent}","${activity.task_type}","${activity.content_type}","${activity.topic || ''}","${activity.channel || ''}","${activity.status}","${result.impressions || 0}","${result.engagement || 0}"\n`
  }

  return csv
}

export function archiveOldActivities(keepDays: number = 365): number {
  const db = getDatabase()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - keepDays)

  const stmt = db.prepare(`
    DELETE FROM activities
    WHERE timestamp < ?
  `)

  const info = stmt.run(cutoffDate.toISOString())
  return info.changes as number
}
