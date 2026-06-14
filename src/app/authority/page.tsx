'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Users, Radio, Calendar, Zap } from 'lucide-react'

interface AuthorityData {
  current: {
    authority_score: number
    followers: number
    reach: number
    mentions: number
    engagement_rate: number
    media_mentions_count: number
    speaking_events_count: number
  }
  recentMentions: Array<{
    id: number
    title: string
    outlet: string
    mention_type: string
    date_published: string
    reach: number
  }>
  upcomingEvents: Array<{
    id: number
    event_name: string
    event_date: string
    event_type: string
    platform: string
    audience_size: number
    topic: string
  }>
  trends: Array<{
    date: string
    authority_score: number
    followers: number
  }>
}

export default function AuthorityDashboard() {
  const [data, setData] = useState<AuthorityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/authority/metrics')
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        } else {
          setError('Failed to load authority metrics')
        }
      } catch (err) {
        setError('Error connecting to API')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Loading authority metrics...</p>
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

  const scoreColor =
    data.current.authority_score >= 75
      ? 'from-green-500 to-emerald-600'
      : data.current.authority_score >= 50
        ? 'from-blue-500 to-cyan-600'
        : 'from-amber-500 to-orange-600'

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Authority Dashboard</h1>
        <p className="text-slate-400">Track your influence, thought leadership, and media presence</p>
      </div>

      {/* Authority Score Card */}
      <div className={`bg-gradient-to-br ${scoreColor} rounded-xl p-8 text-white shadow-xl`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold opacity-90">Authority Score</p>
            <p className="text-6xl font-bold mt-2">{data.current.authority_score.toFixed(0)}</p>
            <p className="text-sm opacity-75 mt-2">Out of 100 | {data.current.media_mentions_count} media mentions + {data.current.speaking_events_count} events</p>
          </div>
          <div className="text-8xl opacity-20">
            <Zap />
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard icon={<Users size={24} />} label="Followers" value={data.current.followers.toLocaleString()} color="from-blue-500 to-cyan-600" />
        <MetricCard icon={<TrendingUp size={24} />} label="Reach (Last 30d)" value={data.current.reach.toLocaleString()} color="from-purple-500 to-pink-600" />
        <MetricCard icon={<Radio size={24} />} label="Media Mentions" value={data.current.mentions} color="from-amber-500 to-orange-600" />
        <MetricCard icon={<Calendar size={24} />} label="Speaking Events" value={data.current.speaking_events_count} color="from-green-500 to-emerald-600" />
      </div>

      {/* Trends Section */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">7-Day Trend</h2>
        <div className="space-y-3">
          {data.trends.length > 0 ? (
            data.trends.reverse().map((trend) => (
              <div key={trend.date} className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{trend.date}</span>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                      style={{ width: `${(trend.authority_score / 100) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-semibold w-12 text-right">{trend.authority_score.toFixed(0)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-sm">No trend data yet</p>
          )}
        </div>
      </div>

      {/* Recent Media Mentions */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Media Mentions</h2>
        <div className="space-y-4">
          {data.recentMentions.length > 0 ? (
            data.recentMentions.map((mention) => (
              <div key={mention.id} className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{mention.title}</h3>
                    <p className="text-sm text-slate-400 mt-1">{mention.outlet}</p>
                    <p className="text-xs text-slate-500 mt-2">{mention.date_published}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-cyan-400">{mention.reach} reach</p>
                    <p className="text-xs text-slate-400 mt-1">{mention.mention_type}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-sm">No media mentions yet. Start getting featured!</p>
          )}
        </div>
      </div>

      {/* Upcoming Speaking Events */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Upcoming Speaking Events</h2>
        <div className="space-y-4">
          {data.upcomingEvents.length > 0 ? (
            data.upcomingEvents.map((event) => (
              <div key={event.id} className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{event.event_name}</h3>
                    <p className="text-sm text-slate-400 mt-1">{event.platform}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {event.event_date} • {event.event_type}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Topic: {event.topic}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-400">{event.audience_size} attendees</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-sm">No upcoming events scheduled</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}

function MetricCard({ icon, label, value, color }: MetricCardProps) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-lg p-4 text-white`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="opacity-80">{icon}</div>
      </div>
      <p className="text-sm opacity-90">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}
