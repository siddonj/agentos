import { getDatabase } from '../db'

export interface AuthorityMetrics {
  date: string
  followers: number
  reach: number
  mentions: number
  engagement_rate: number
  authority_score: number
  speaking_events_count: number
  media_mentions_count: number
  updated_at: string
}

export interface MediaMention {
  id?: number
  date_published: string
  title: string
  outlet: string
  mention_type: string
  url?: string
  reach: number
  notes?: string
  created_at?: string
}

export interface SpeakingEvent {
  id?: number
  event_name: string
  event_date: string
  event_type: string
  platform: string
  audience_size: number
  topic: string
  status: 'scheduled' | 'completed' | 'cancelled'
  recording_url?: string
  created_at?: string
}

export function aggregateAuthorityMetrics(date: string): AuthorityMetrics {
  const db = getDatabase()

  const mediaCount = db.prepare('SELECT COUNT(*) as count FROM media_mentions').get() || { count: 0 }
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM speaking_events WHERE status = ?').get('completed') || { count: 0 }

  const metrics = db.prepare('SELECT * FROM authority_metrics WHERE date = ?').get(date)

  if (metrics) {
    return metrics
  }

  const newMetrics: AuthorityMetrics = {
    date,
    followers: 0,
    reach: 0,
    mentions: 0,
    engagement_rate: 0,
    authority_score: calculateAuthorityScore(mediaCount.count, eventCount.count),
    speaking_events_count: eventCount.count,
    media_mentions_count: mediaCount.count,
    updated_at: new Date().toISOString(),
  }

  db.prepare(
    `INSERT INTO authority_metrics (date, followers, reach, mentions, engagement_rate, authority_score, speaking_events_count, media_mentions_count, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    newMetrics.date,
    newMetrics.followers,
    newMetrics.reach,
    newMetrics.mentions,
    newMetrics.engagement_rate,
    newMetrics.authority_score,
    newMetrics.speaking_events_count,
    newMetrics.media_mentions_count,
    newMetrics.updated_at
  )

  return newMetrics
}

export function logMediaMention(mention: MediaMention): number {
  const db = getDatabase()
  const result = db.prepare(
    `INSERT INTO media_mentions (date_published, title, outlet, mention_type, url, reach, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    mention.date_published,
    mention.title,
    mention.outlet,
    mention.mention_type,
    mention.url || '',
    mention.reach,
    mention.notes || '',
    new Date().toISOString()
  )
  return result.lastInsertRowid || 0
}

export function logSpeakingEvent(event: SpeakingEvent): number {
  const db = getDatabase()
  const result = db.prepare(
    `INSERT INTO speaking_events (event_name, event_date, event_type, platform, audience_size, topic, status, recording_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    event.event_name,
    event.event_date,
    event.event_type,
    event.platform,
    event.audience_size,
    event.topic,
    event.status,
    event.recording_url || '',
    new Date().toISOString()
  )
  return result.lastInsertRowid || 0
}

export function getAuthorityMetrics(date?: string): AuthorityMetrics[] {
  const db = getDatabase()
  if (date) {
    const metric = db.prepare('SELECT * FROM authority_metrics WHERE date = ?').get(date)
    return metric ? [metric] : []
  }
  return db.prepare('SELECT * FROM authority_metrics ORDER BY date DESC LIMIT 30').all()
}

export function getMediaMentions(limit: number = 10): MediaMention[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM media_mentions ORDER BY date_published DESC LIMIT ?').all(limit)
}

export function getUpcomingSpeakingEvents(limit: number = 5): SpeakingEvent[] {
  const db = getDatabase()
  return db.prepare(`SELECT * FROM speaking_events WHERE status = 'scheduled' ORDER BY event_date ASC LIMIT ?`).all(limit)
}

export function getCompletedSpeakingEvents(limit: number = 10): SpeakingEvent[] {
  const db = getDatabase()
  return db.prepare(`SELECT * FROM speaking_events WHERE status = 'completed' ORDER BY event_date DESC LIMIT ?`).all(limit)
}

export function updateSpeakingEventStatus(eventId: number, status: 'scheduled' | 'completed' | 'cancelled'): void {
  const db = getDatabase()
  db.prepare('UPDATE speaking_events SET status = ? WHERE id = ?').run(status, eventId)
}

function calculateAuthorityScore(mediaCount: number, eventCount: number): number {
  const baseScore = 50
  const mediaBoost = mediaCount * 5
  const eventBoost = eventCount * 8
  return Math.min(baseScore + mediaBoost + eventBoost, 100)
}

export function getTrendData(days: number = 30): AuthorityMetrics[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM authority_metrics ORDER BY date DESC LIMIT ?').all(days)
}

export function getAuthorityDashboardData() {
  const db = getDatabase()
  const latestMetric = db.prepare('SELECT * FROM authority_metrics ORDER BY date DESC LIMIT 1').get()
  const recentMentions = getMediaMentions(5)
  const upcomingEvents = getUpcomingSpeakingEvents(3)
  const trendData = getTrendData(7)

  return {
    current: latestMetric || createDefaultMetrics(),
    recentMentions,
    upcomingEvents,
    trends: trendData,
  }
}

function createDefaultMetrics(): AuthorityMetrics {
  return {
    date: new Date().toISOString().split('T')[0],
    followers: 0,
    reach: 0,
    mentions: 0,
    engagement_rate: 0,
    authority_score: 0,
    speaking_events_count: 0,
    media_mentions_count: 0,
    updated_at: new Date().toISOString(),
  }
}
