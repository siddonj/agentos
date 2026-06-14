import { getDatabase } from '../db'

export interface StrategicPlan {
  id?: number
  title: string
  objective: string
  timeline_days: number
  target_metrics: Record<string, number>
  status: 'active' | 'completed' | 'paused'
  priority: number
  created_at?: string
  updated_at?: string
}

export interface PerformanceForecast {
  id?: number
  metric_name: string
  forecast_date: string
  predicted_value: number
  confidence_level: number
  trend: 'up' | 'down' | 'stable'
  last_updated?: string
}

export interface Recommendation {
  id?: number
  category: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  impact_score: number
  implementation_effort: 'easy' | 'medium' | 'hard'
  status: 'suggested' | 'in_progress' | 'completed'
  created_at?: string
}

export function createStrategicPlan(plan: StrategicPlan): number {
  const db = getDatabase()
  const result = db.prepare(
    `INSERT INTO strategic_plans (title, objective, timeline_days, target_metrics, status, priority, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    plan.title,
    plan.objective,
    plan.timeline_days,
    JSON.stringify(plan.target_metrics || {}),
    plan.status || 'active',
    plan.priority || 5,
    new Date().toISOString(),
    new Date().toISOString()
  )
  return result.lastInsertRowid || 0
}

export function getStrategicPlans(status?: string): StrategicPlan[] {
  const db = getDatabase()
  let plans
  if (status) {
    plans = db.prepare(`SELECT * FROM strategic_plans WHERE status = ? ORDER BY priority DESC`).all(status)
  } else {
    plans = db.prepare(`SELECT * FROM strategic_plans ORDER BY priority DESC`).all()
  }

  return plans.map((p: any) => ({
    ...p,
    target_metrics: JSON.parse(p.target_metrics || '{}'),
  }))
}

export function addForecast(forecast: PerformanceForecast): number {
  const db = getDatabase()
  const result = db.prepare(
    `INSERT INTO performance_forecasts (metric_name, forecast_date, predicted_value, confidence_level, trend, last_updated)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(forecast.metric_name, forecast.forecast_date, forecast.predicted_value, forecast.confidence_level, forecast.trend, new Date().toISOString())

  return result.lastInsertRowid || 0
}

export function getForecasts(metricName?: string): PerformanceForecast[] {
  const db = getDatabase()
  if (metricName) {
    return db.prepare(`SELECT * FROM performance_forecasts WHERE metric_name = ? ORDER BY forecast_date DESC`).all(metricName)
  }
  return db.prepare(`SELECT * FROM performance_forecasts ORDER BY forecast_date DESC`).all()
}

export function addRecommendation(recommendation: Recommendation): number {
  const db = getDatabase()
  const result = db.prepare(
    `INSERT INTO recommendations (category, title, description, priority, impact_score, implementation_effort, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    recommendation.category,
    recommendation.title,
    recommendation.description || '',
    recommendation.priority || 'medium',
    recommendation.impact_score || 0,
    recommendation.implementation_effort || 'medium',
    recommendation.status || 'suggested',
    new Date().toISOString()
  )

  return result.lastInsertRowid || 0
}

export function getRecommendations(status?: string, priority?: string): Recommendation[] {
  const db = getDatabase()
  let query = `SELECT * FROM recommendations WHERE 1=1`
  const params: any[] = []

  if (status) {
    query += ` AND status = ?`
    params.push(status)
  }

  if (priority) {
    query += ` AND priority = ?`
    params.push(priority)
  }

  query += ` ORDER BY impact_score DESC`

  return db.prepare(query).all(...params)
}

export function updateRecommendationStatus(recommendationId: number, status: string): void {
  const db = getDatabase()
  db.prepare('UPDATE recommendations SET status = ? WHERE id = ?').run(status, recommendationId)
}

export function generateInsights(
  totalActivities: number,
  avgEngagement: number,
  completionRate: number,
  authorityScore: number
): Recommendation[] {
  const recommendations: Recommendation[] = []

  // Content frequency insight
  if (totalActivities < 5) {
    addRecommendation({
      category: 'Content',
      title: 'Increase Content Frequency',
      description: 'Current posting frequency is below optimal. Aim for 5+ posts per week for better reach.',
      priority: 'high',
      impact_score: 8.5,
      implementation_effort: 'easy',
    })
  }

  // Engagement optimization
  if (avgEngagement < 5) {
    addRecommendation({
      category: 'Engagement',
      title: 'Optimize Content for Higher Engagement',
      description: 'Focus on interactive content formats: questions, polls, and call-to-actions.',
      priority: 'high',
      impact_score: 7.8,
      implementation_effort: 'medium',
    })
  }

  // Authority building
  if (authorityScore < 50) {
    addRecommendation({
      category: 'Authority',
      title: 'Accelerate Authority Building',
      description: 'Schedule speaking engagements and pursue media features in high-profile outlets.',
      priority: 'high',
      impact_score: 9.2,
      implementation_effort: 'hard',
    })
  }

  // Execution efficiency
  if (completionRate < 85) {
    addRecommendation({
      category: 'Operations',
      title: 'Improve Task Completion Rate',
      description: 'Analyze bottlenecks in your workflow pipeline and optimize resource allocation.',
      priority: 'medium',
      impact_score: 6.5,
      implementation_effort: 'medium',
    })
  }

  // Cross-channel expansion
  addRecommendation({
    category: 'Channels',
    title: 'Expand to Emerging Channels',
    description: 'Consider LinkedIn Newsletters, Substack, or YouTube Shorts to reach new audiences.',
    priority: 'medium',
    impact_score: 7.2,
    implementation_effort: 'medium',
  })

  return getRecommendations('suggested')
}

export function calculateROI(
  investedCost: number,
  followers: number,
  reach: number,
  mentionValue: number
): Record<string, number> {
  const totalValue = followers * 0.5 + reach * 0.02 + mentionValue * 5
  const roi = investedCost > 0 ? ((totalValue - investedCost) / investedCost) * 100 : 0

  return {
    total_investment: investedCost,
    estimated_value: totalValue,
    roi_percentage: roi,
    followers_acquired: followers,
    reach_generated: reach,
    media_mention_value: mentionValue,
  }
}

export function getForecastTrend(metricName: string): PerformanceForecast[] {
  const db = getDatabase()
  return db.prepare(`SELECT * FROM performance_forecasts WHERE metric_name = ? ORDER BY forecast_date ASC LIMIT 30`).all(metricName)
}

export function getAnalyticsDashboardData() {
  const db = getDatabase()

  const plans = getStrategicPlans('active')
  const recommendations = getRecommendations('suggested', 'high')
  const forecasts = db.prepare(`SELECT DISTINCT metric_name FROM performance_forecasts LIMIT 5`).all()

  const activitiesCount = db.prepare(`SELECT COUNT(*) as count FROM activities`).get()
  const completedTasks = db.prepare(`SELECT COUNT(*) as count FROM execution_queue WHERE status = 'completed'`).get()
  const totalCost = db.prepare(`SELECT COALESCE(SUM(cost), 0) as total FROM activity_log`).get()

  return {
    strategic_plans: plans,
    top_recommendations: recommendations.slice(0, 5),
    forecast_metrics: forecasts,
    total_activities: activitiesCount?.count || 0,
    completed_tasks: completedTasks?.count || 0,
    total_cost: totalCost?.total || 0,
    timestamp: new Date().toISOString(),
  }
}

export function generateNextSteps(plans: StrategicPlan[]): string[] {
  const steps: string[] = []

  plans.forEach((plan) => {
    if (plan.timeline_days <= 7) {
      steps.push(`Finalize: ${plan.title}`)
    } else if (plan.timeline_days <= 30) {
      steps.push(`Progress on: ${plan.title}`)
    } else {
      steps.push(`Plan: ${plan.title}`)
    }
  })

  return steps
}
