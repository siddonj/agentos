import { getDatabase } from '../db'
import { promises as fs } from 'fs'
import path from 'path'
import { getConfig } from '../config'

export interface Pattern {
  pattern_type: 'topic' | 'channel' | 'content_type' | 'timing' | 'author'
  insight: string
  data: Record<string, any>
  confidence: number
  sample_size: number
}

export async function analyzePatterns(): Promise<Pattern[]> {
  const patterns: Pattern[] = []

  patterns.push(...analyzeTopics())
  patterns.push(...analyzeChannels())
  patterns.push(...analyzeContentTypes())
  patterns.push(...analyzeTiming())

  const validPatterns = patterns.filter((p) => p.confidence >= 0.6)

  for (const pattern of validPatterns) {
    savePattern(pattern)
  }

  await updatePatternVault(validPatterns)

  return validPatterns
}

function analyzeTopics(): Pattern[] {
  const patterns: Pattern[] = []
  const db = getDatabase()

  const stmt = db.prepare(`
    SELECT
      topic,
      COUNT(*) as post_count,
      AVG(CAST(engagement_rate AS FLOAT)) as engagement,
      SUM(CAST(COALESCE(impressions, 0) AS INTEGER)) as total_impressions
    FROM analytics
    WHERE date >= DATE('now', '-30 days') AND topic IS NOT NULL
    GROUP BY topic
    ORDER BY post_count DESC
  `)

  const topics = stmt.all() as any[]
  if (topics.length === 0) return patterns

  const avgEngagement = topics.reduce((sum, t) => sum + (t.engagement || 0), 0) / topics.length

  for (const topic of topics) {
    if (topic.post_count < 5) continue

    const multiplier = (topic.engagement || 0) / avgEngagement
    const confidence = Math.min(1.0, topic.post_count / 15)

    if (multiplier > 1.4 && confidence >= 0.6) {
      patterns.push({
        pattern_type: 'topic',
        insight: `"${topic.topic}" posts get ${multiplier.toFixed(1)}x engagement vs average`,
        data: {
          topic: topic.topic,
          engagement_score: multiplier,
          post_count: topic.post_count,
          avg_impressions: Math.round(topic.total_impressions / topic.post_count),
        },
        confidence,
        sample_size: topic.post_count,
      })
    }
  }

  return patterns
}

function analyzeChannels(): Pattern[] {
  const patterns: Pattern[] = []
  const db = getDatabase()

  const stmt = db.prepare(`
    SELECT
      channel,
      COUNT(*) as post_count,
      AVG(CAST(engagement_rate AS FLOAT)) as avg_engagement,
      AVG(CAST(impressions AS INTEGER)) as avg_impressions
    FROM analytics
    WHERE date >= DATE('now', '-30 days') AND channel IS NOT NULL
    GROUP BY channel
    ORDER BY post_count DESC
  `)

  const channels = stmt.all() as any[]
  if (channels.length === 0) return patterns

  const avgEngagement = channels.reduce((sum, c) => sum + (c.avg_engagement || 0), 0) / channels.length

  for (const channel of channels) {
    if (channel.post_count < 8) continue

    const multiplier = (channel.avg_engagement || 0) / avgEngagement
    const confidence = Math.min(1.0, channel.post_count / 20)

    if (multiplier > 1.3 && confidence >= 0.6) {
      patterns.push({
        pattern_type: 'channel',
        insight: `${channel.channel} performs ${(multiplier * 100).toFixed(0)}% better than average`,
        data: {
          channel: channel.channel,
          effectiveness_multiplier: multiplier,
          post_count: channel.post_count,
          avg_engagement: (channel.avg_engagement * 100).toFixed(2) + '%',
        },
        confidence,
        sample_size: channel.post_count,
      })
    }
  }

  return patterns
}

function analyzeContentTypes(): Pattern[] {
  const patterns: Pattern[] = []
  const db = getDatabase()

  const stmt = db.prepare(`
    SELECT
      content_type,
      COUNT(*) as post_count,
      AVG(CAST(engagement_rate AS FLOAT)) as avg_engagement
    FROM analytics
    WHERE date >= DATE('now', '-30 days') AND content_type IS NOT NULL
    GROUP BY content_type
    ORDER BY post_count DESC
  `)

  const types = stmt.all() as any[]
  if (types.length === 0) return patterns

  const avgEngagement = types.reduce((sum, t) => sum + (t.avg_engagement || 0), 0) / types.length

  for (const type of types) {
    if (type.post_count < 5) continue

    const multiplier = (type.avg_engagement || 0) / avgEngagement
    const confidence = Math.min(1.0, type.post_count / 12)

    if (multiplier > 1.5 && confidence >= 0.6) {
      patterns.push({
        pattern_type: 'content_type',
        insight: `${type.content_type} format gets ${multiplier.toFixed(1)}x engagement`,
        data: {
          content_type: type.content_type,
          effectiveness: multiplier,
          post_count: type.post_count,
          avg_engagement: (type.avg_engagement * 100).toFixed(2) + '%',
        },
        confidence,
        sample_size: type.post_count,
      })
    }
  }

  return patterns
}

function analyzeTiming(): Pattern[] {
  const patterns: Pattern[] = []
  const db = getDatabase()

  const stmt = db.prepare(`
    SELECT
      CAST(STRFTIME('%w', date) AS INTEGER) as day_of_week,
      COUNT(*) as post_count,
      AVG(CAST(engagement_rate AS FLOAT)) as avg_engagement
    FROM analytics
    WHERE date >= DATE('now', '-30 days')
    GROUP BY day_of_week
  `)

  const days = stmt.all() as any[]
  if (days.length === 0) return patterns

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const avgEngagement = days.reduce((sum, d) => sum + (d.avg_engagement || 0), 0) / days.length

  for (const day of days) {
    if (day.post_count < 2) continue

    const multiplier = (day.avg_engagement || 0) / avgEngagement
    const confidence = Math.min(1.0, day.post_count / 5)

    if (multiplier > 1.2 && confidence >= 0.6) {
      patterns.push({
        pattern_type: 'timing',
        insight: `Posts on ${dayNames[day.day_of_week]} get ${(multiplier * 100 - 100).toFixed(0)}% more engagement`,
        data: {
          day: dayNames[day.day_of_week],
          day_of_week: day.day_of_week,
          multiplier,
          post_count: day.post_count,
          avg_engagement: (day.avg_engagement * 100).toFixed(2) + '%',
        },
        confidence,
        sample_size: day.post_count,
      })
    }
  }

  return patterns
}

function savePattern(pattern: Pattern): void {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO patterns (
      pattern_type,
      insight,
      data,
      confidence,
      sample_size,
      created_date
    ) VALUES (?, ?, ?, ?, ?, ?)
  `)

  const dataJson = JSON.stringify(pattern.data)
  const now = new Date().toISOString()

  stmt.run(
    pattern.pattern_type,
    pattern.insight,
    dataJson,
    pattern.confidence,
    pattern.sample_size,
    now
  )
}

export function getActivePatterns(): Pattern[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT
      pattern_type,
      insight,
      data,
      confidence,
      sample_size
    FROM patterns
    ORDER BY confidence DESC, sample_size DESC
  `)

  const rows = stmt.all() as any[]

  return rows.map((row) => ({
    ...row,
    data: JSON.parse(row.data),
  }))
}

export function getPatternsByType(type: string): Pattern[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT
      pattern_type,
      insight,
      data,
      confidence,
      sample_size
    FROM patterns
    WHERE pattern_type = ?
    ORDER BY confidence DESC
  `)

  const rows = stmt.all(type) as any[]

  return rows.map((row) => ({
    ...row,
    data: JSON.parse(row.data),
  }))
}

async function updatePatternVault(patterns: Pattern[]): Promise<void> {
  const config = getConfig()
  const vaultPath = path.join(config.vaultRoot, 'analytics')

  try {
    await fs.mkdir(vaultPath, { recursive: true })
  } catch {
    // Directory exists
  }

  let content = `# Content Patterns\n\nAnalyzed on: ${new Date().toLocaleDateString()}\n\n`

  const byType: Record<string, Pattern[]> = {}
  for (const pattern of patterns) {
    if (!byType[pattern.pattern_type]) byType[pattern.pattern_type] = []
    byType[pattern.pattern_type].push(pattern)
  }

  for (const [type, typePatterns] of Object.entries(byType)) {
    content += `## ${type.replace('_', ' ').toUpperCase()}\n\n`

    for (const pattern of typePatterns) {
      content += `- **${pattern.insight}**\n`
      content += `  - Confidence: ${(pattern.confidence * 100).toFixed(0)}%\n`
      content += `  - Sample: ${pattern.sample_size} posts\n\n`
    }
  }

  const filePath = path.join(vaultPath, 'patterns.md')
  await fs.writeFile(filePath, content, 'utf-8')
}

export function cleanupOldPatterns(daysToKeep: number = 90): number {
  const db = getDatabase()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const stmt = db.prepare(`
    DELETE FROM patterns
    WHERE created_date < ?
  `)

  const info = stmt.run(cutoffDate.toISOString())
  return info.changes as number
}
