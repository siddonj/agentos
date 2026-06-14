'use client'

import { useEffect, useState } from 'react'
import { Zap, AlertCircle, Loader, TrendingUp, Clock, CheckCircle } from 'lucide-react'

interface Agent {
  agent: string
  status: string
  current_task?: string
  last_updated: string
  metrics: {
    total: number
    completed: number
    failed: number
    success_rate: number
    avg_duration: number
  }
}

interface ControlRoomData {
  agents: Agent[]
  tasks: {
    pending: number
    in_progress: number
    total_pending_and_active: number
  }
  recent_activity: any[]
  cost_7_days: number
}

const statusColors: Record<string, string> = {
  idle: 'bg-gray-600',
  working: 'bg-blue-600',
  researching: 'bg-cyan-600',
  drafting: 'bg-purple-600',
  publishing: 'bg-green-600',
  analyzing: 'bg-amber-600',
  error: 'bg-red-600',
}

export default function ControlRoomPage() {
  const [data, setData] = useState<ControlRoomData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStatus() {
    try {
      const response = await fetch('/api/control-room/status')
      const result = await response.json()

      if (result.success) {
        setData(result)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch status')
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
          <p className="text-slate-300">Loading Control Room...</p>
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
              <h2 className="text-lg font-semibold text-red-300 mb-2">Error Loading Control Room</h2>
              <p className="text-red-200">{error}</p>
              <button
                onClick={fetchStatus}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Control Room</h1>
          </div>
          <div className="text-sm text-slate-400">
            Last updated: {new Date(data?.timestamp || Date.now()).toLocaleTimeString()}
          </div>
        </div>

        {/* Agent Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.agents.map((agent) => (
            <div key={agent.agent} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur">
              <h3 className="font-semibold text-white mb-3">{agent.agent}</h3>

              <div className="mb-3 flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${statusColors[agent.status] || statusColors.idle}`}
                />
                <span className="text-sm text-slate-300 capitalize">{agent.status}</span>
              </div>

              {agent.current_task && (
                <p className="text-xs text-slate-400 mb-2 truncate">{agent.current_task}</p>
              )}

              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Tasks:</span>
                  <span className="text-slate-200 font-medium">{agent.metrics.completed}/{agent.metrics.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Success:</span>
                  <span className="text-green-400">{(agent.metrics.success_rate * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Duration:</span>
                  <span className="text-slate-200">{Math.round(agent.metrics.avg_duration)}s</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Task Queue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Pending Tasks</h3>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-3xl font-bold text-amber-400">{data?.tasks.pending}</p>
            <p className="text-xs text-slate-400 mt-1">Waiting to start</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">In Progress</h3>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-400">{data?.tasks.in_progress}</p>
            <p className="text-xs text-slate-400 mt-1">Currently executing</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">7-Day Cost</h3>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-400">${data?.cost_7_days.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">API + execution costs</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur">
          <h3 className="font-semibold text-white mb-4">Recent Activity (Last 24h)</h3>

          {data?.recent_activity && data.recent_activity.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.recent_activity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm py-2 border-b border-slate-700/50">
                  <div
                    className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                      activity.status === 'success'
                        ? 'bg-green-500'
                        : activity.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-amber-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300">
                      <span className="font-medium">{activity.agent}</span>
                      {' '}
                      <span className="text-slate-400">{activity.action}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {activity.duration_seconds && (
                    <div className="text-xs text-slate-400 flex-shrink-0">
                      {activity.duration_seconds}s
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No activity in the last 24 hours</p>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <p className="text-blue-300 text-sm">
            <strong>How to use:</strong> This dashboard updates every 5 seconds. Agents report their status here when
            they start/complete tasks. Log activities via the API to see them appear below.
          </p>
        </div>
      </div>
    </div>
  )
}
