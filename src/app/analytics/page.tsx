'use client'

import React, { useEffect, useState } from 'react'
import { BarChart3, AlertCircle, Loader } from 'lucide-react'

interface Pattern {
  pattern_type: string
  insight: string
  data: Record<string, any>
  confidence: number
  sample_size: number
}

interface AnalyticsData {
  patterns: Pattern[]
  recommendations: string[]
  metrics?: {
    total_posts: number
    total_impressions: number
    avg_engagement: number
    follower_growth: number
  }
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInsights()
  }, [])

  async function fetchInsights() {
    try {
      setLoading(true)
      const response = await fetch('/api/learning/insights')
      const result = await response.json()

      if (result.success) {
        setData(result)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch insights')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto bg-red-900/20 border border-red-700 rounded-lg p-6">
          <div className="flex gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-red-300 mb-2">Error Loading Analytics</h2>
              <p className="text-red-200">{error}</p>
              <button
                onClick={fetchInsights}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.patterns.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto bg-blue-900/20 border border-blue-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-300 mb-2">No Patterns Yet</h2>
          <p className="text-blue-200">
            The learning system needs at least 5 posts across multiple topics to identify patterns. Keep posting!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          </div>
          <button
            onClick={fetchInsights}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            Refresh
          </button>
        </div>

        {/* Metrics Cards */}
        {data.metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard title="Total Posts" value={data.metrics.total_posts} subtitle="Last 7 days" />
            <MetricCard
              title="Total Reach"
              value={data.metrics.total_impressions.toLocaleString()}
              subtitle="Impressions"
            />
            <MetricCard
              title="Avg Engagement"
              value={`${data.metrics.avg_engagement.toFixed(1)}%`}
              subtitle="Rate"
            />
            <MetricCard
              title="Follower Growth"
              value={`+${data.metrics.follower_growth}`}
              subtitle="New followers"
            />
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-amber-300 mb-4">🎯 Recommended Actions</h2>
            <ul className="space-y-2">
              {data.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="inline-block w-6 h-6 mr-3 rounded-full bg-amber-500 text-white text-center text-sm font-semibold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-amber-200">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Patterns by Type */}
        <div className="space-y-6">
          <PatternGroup
            patterns={data.patterns.filter((p) => p.pattern_type === 'topic')}
            title="📌 Topic Patterns"
            description="Which topics get the most engagement"
          />
          <PatternGroup
            patterns={data.patterns.filter((p) => p.pattern_type === 'channel')}
            title="📢 Channel Patterns"
            description="Which platforms work best"
          />
          <PatternGroup
            patterns={data.patterns.filter((p) => p.pattern_type === 'content_type')}
            title="📝 Content Type Patterns"
            description="Which formats perform best"
          />
          <PatternGroup
            patterns={data.patterns.filter((p) => p.pattern_type === 'timing')}
            title="⏰ Timing Patterns"
            description="Best days and times to post"
          />
        </div>

        {/* Last Updated */}
        <div className="text-sm text-slate-400 border-t border-slate-700 pt-4">
          Last updated: {new Date(data.generated_at || Date.now()).toLocaleString()}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, subtitle }: { title: string; value: any; subtitle: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur">
      <p className="text-slate-400 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
      <p className="text-slate-500 text-xs mt-1">{subtitle}</p>
    </div>
  )
}

function PatternGroup({
  patterns,
  title,
  description,
}: {
  patterns: Pattern[]
  title: string
  description: string
}) {
  if (patterns.length === 0) return null

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur">
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-slate-400 text-sm mb-4">{description}</p>

      <div className="space-y-4">
        {patterns.map((pattern, idx) => (
          <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-white">{pattern.insight}</p>
                <p className="text-sm text-slate-400 mt-1">
                  Based on {pattern.sample_size} {pattern.sample_size === 1 ? 'post' : 'posts'}
                </p>
              </div>
              <ConfidenceBadge confidence={pattern.confidence} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100)
  const bgColor =
    confidence >= 0.8
      ? 'bg-green-900/30 text-green-300 border border-green-700'
      : confidence >= 0.6
        ? 'bg-blue-900/30 text-blue-300 border border-blue-700'
        : 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${bgColor}`}>
      {percentage}% confident
    </span>
  )
}
