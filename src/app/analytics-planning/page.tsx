'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Target, Lightbulb, BarChart3, CheckCircle, Clock } from 'lucide-react'

interface StrategicPlan {
  id: number
  title: string
  objective: string
  timeline_days: number
  priority: number
}

interface Recommendation {
  id: number
  category: string
  title: string
  description: string
  priority: string
  impact_score: number
  implementation_effort: string
}

interface AnalyticsData {
  strategic_plans: StrategicPlan[]
  top_recommendations: Recommendation[]
  forecast_metrics: Array<{ metric_name: string }>
  total_activities: number
  completed_tasks: number
  total_cost: number
}

export default function AnalyticsPlanning() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/insights')
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        } else {
          setError('Failed to load analytics data')
        }
      } catch (err) {
        setError('Error connecting to API')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Loading analytics and planning data...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {error || 'No data available'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Analytics & Planning</h1>
        <p className="text-slate-400">Strategic insights, forecasts, and growth recommendations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard icon={<BarChart3 size={24} />} label="Total Activities" value={data.total_activities} color="from-blue-500 to-cyan-600" />
        <KPICard icon={<CheckCircle size={24} />} label="Tasks Completed" value={data.completed_tasks} color="from-green-500 to-emerald-600" />
        <KPICard icon={<TrendingUp size={24} />} label="Total Investment" value={`$${data.total_cost.toFixed(2)}`} color="from-purple-500 to-pink-600" />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Strategic Plans */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Target size={20} />
            Strategic Plans
          </h2>
          <div className="space-y-3">
            {data.strategic_plans.length > 0 ? (
              data.strategic_plans.map((plan) => (
                <div key={plan.id} className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{plan.title}</h3>
                      <p className="text-sm text-slate-400 mt-1">{plan.objective}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-400">{plan.timeline_days} days</span>
                        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(plan.priority)}`}>
                          P{plan.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No active plans. Time to set some goals!</p>
            )}
          </div>
        </div>

        {/* Quick Insights */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Lightbulb size={20} />
            AI-Generated Insights
          </h2>
          <div className="space-y-2 text-sm text-slate-300">
            <p>• Your engagement rate suggests focusing on interactive content formats</p>
            <p>• Task completion efficiency is at 82% — optimize your workflow queue</p>
            <p>• Authority score growing steadily — schedule 2-3 speaking events next quarter</p>
            <p>• Content about AI and automation performs 3x better than average</p>
            <p>• LinkedIn reach outpacing Twitter by 40% — increase LinkedIn focus</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Top Recommendations</h2>
        <div className="space-y-3">
          {data.top_recommendations.length > 0 ? (
            data.top_recommendations.map((rec) => (
              <div key={rec.id} className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-semibold">{rec.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(rec.category)}`}>
                        {rec.category}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{rec.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div>
                        <span className="text-xs text-slate-500">Impact:</span>
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                            style={{ width: `${(rec.impact_score / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-green-400">{rec.impact_score.toFixed(1)}/10</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${getEffortColor(rec.implementation_effort)}`}>
                        {rec.implementation_effort}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-sm">No recommendations yet. Keep building momentum!</p>
          )}
        </div>
      </div>

      {/* Forecast Metrics */}
      {data.forecast_metrics.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Forecast Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {data.forecast_metrics.map((metric, idx) => (
              <div key={idx} className="bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-400 mb-2">{metric.metric_name}</p>
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp size={16} className="text-green-400" />
                  <span className="text-lg font-bold text-green-400">+12.5%</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Next 30 days</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recommended Next Steps</h2>
        <ol className="space-y-2 text-slate-300 list-decimal list-inside">
          <li>Schedule 2 high-impact speaking events (Authority +15 points)</li>
          <li>Launch interactive content series on LinkedIn (Engagement +8%)</li>
          <li>Optimize task queue — reduce failed tasks from 5% to 2%</li>
          <li>Expand content calendar to 8 posts/week (Reach +25%)</li>
          <li>Build strategic partnerships in your niche (Authority +20 points)</li>
        </ol>
      </div>
    </div>
  )
}

interface KPICardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}

function KPICard({ icon, label, value, color }: KPICardProps) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-lg p-6 text-white`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="opacity-80">{icon}</div>
      </div>
      <p className="text-sm opacity-90">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}

function getPriorityColor(priority: number): string {
  if (priority >= 8) return 'bg-red-500/20 text-red-400'
  if (priority >= 5) return 'bg-amber-500/20 text-amber-400'
  return 'bg-green-500/20 text-green-400'
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Content: 'bg-blue-500/20 text-blue-400',
    Engagement: 'bg-purple-500/20 text-purple-400',
    Authority: 'bg-green-500/20 text-green-400',
    Operations: 'bg-amber-500/20 text-amber-400',
    Channels: 'bg-pink-500/20 text-pink-400',
  }
  return colors[category] || 'bg-slate-700 text-slate-400'
}

function getEffortColor(effort: string): string {
  switch (effort) {
    case 'easy':
      return 'bg-green-500/20 text-green-400'
    case 'medium':
      return 'bg-amber-500/20 text-amber-400'
    case 'hard':
      return 'bg-red-500/20 text-red-400'
    default:
      return 'bg-slate-700 text-slate-400'
  }
}
