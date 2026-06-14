'use client'

import { useEffect, useState } from 'react'
import { Activity, Zap, CheckCircle, AlertCircle, Clock, Server } from 'lucide-react'

interface ExecutionStats {
  queued: number
  running: number
  completed: number
  failed: number
  avg_duration_seconds: number
}

interface ExecutionQueueItem {
  id: number
  task_id: number
  priority: number
  status: string
  assigned_agent?: string
  queued_at: string
  started_at?: string
  completed_at?: string
  retry_count: number
  max_retries: number
}

interface Resource {
  id: number
  agent: string
  max_concurrent_tasks: number
  current_tasks: number
  cpu_usage: number
  memory_usage: number
  status: string
}

interface ExecutionData {
  stats: ExecutionStats
  queue: ExecutionQueueItem[]
  resources: Resource[]
}

export default function ExecutionMonitor() {
  const [data, setData] = useState<ExecutionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/execution/status')
        const result = await response.json()
        if (result.success) {
          setData(result)
        } else {
          setError('Failed to load execution data')
        }
      } catch (err) {
        setError('Error connecting to API')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    let interval: NodeJS.Timeout | null = null
    if (autoRefresh) {
      interval = setInterval(fetchData, 2000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Loading execution monitor...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">{error || 'No data available'}</div>
      </div>
    )
  }

  const successRate =
    data.stats.completed + data.stats.failed > 0
      ? Math.round(((data.stats.completed / (data.stats.completed + data.stats.failed)) * 100) * 10) / 10
      : 0

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Execution Monitor</h1>
          <p className="text-slate-400">Real-time task queue and parallel execution tracking</p>
        </div>
        <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Auto-refresh (2s)</span>
        </label>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          icon={<Clock size={24} />}
          label="Queued"
          value={data.stats.queued}
          color="from-amber-500 to-orange-600"
        />
        <StatCard
          icon={<Activity size={24} />}
          label="Running"
          value={data.stats.running}
          color="from-blue-500 to-cyan-600"
        />
        <StatCard
          icon={<CheckCircle size={24} />}
          label="Completed"
          value={data.stats.completed}
          color="from-green-500 to-emerald-600"
        />
        <StatCard
          icon={<AlertCircle size={24} />}
          label="Failed"
          value={data.stats.failed}
          color="from-red-500 to-orange-600"
        />
        <StatCard
          icon={<Zap size={24} />}
          label="Success Rate"
          value={`${successRate}%`}
          color="from-purple-500 to-pink-600"
        />
      </div>

      {/* Execution Queue */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Task Queue ({data.queue.length})</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.queue.length > 0 ? (
            data.queue.map((item) => (
              <div key={item.id} className="border border-slate-700 rounded-lg p-3 hover:border-slate-600 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-slate-300">Task #{item.task_id}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded font-semibold ${
                          item.status === 'queued'
                            ? 'bg-amber-500/20 text-amber-400'
                            : item.status === 'running'
                              ? 'bg-blue-500/20 text-blue-400'
                              : item.status === 'completed'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs text-slate-500">P{item.priority}</span>
                    </div>
                    {item.assigned_agent && <p className="text-sm text-slate-400 mt-1">Agent: {item.assigned_agent}</p>}
                    {item.retry_count > 0 && (
                      <p className="text-xs text-amber-400 mt-1">
                        Retries: {item.retry_count}/{item.max_retries}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {item.queued_at ? new Date(item.queued_at).toLocaleTimeString() : '-'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-sm">Queue is empty</p>
          )}
        </div>
      </div>

      {/* Resource Allocation */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Server size={20} />
          Resource Allocation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.resources.map((resource) => (
            <div key={resource.id} className="border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">{resource.agent}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    resource.status === 'available'
                      ? 'bg-green-500/20 text-green-400'
                      : resource.status === 'busy'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {resource.status}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Tasks:</span>
                    <span className="text-white font-semibold">
                      {resource.current_tasks}/{resource.max_concurrent_tasks}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                      style={{
                        width: `${(resource.current_tasks / resource.max_concurrent_tasks) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">CPU:</span>
                    <span className="text-white font-semibold">{((resource.cpu_usage || 0).toFixed(1))}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-600"
                      style={{ width: `${Math.min(resource.cpu_usage || 0, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Memory:</span>
                    <span className="text-white font-semibold">{((resource.memory_usage || 0).toFixed(1))}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-600"
                      style={{ width: `${Math.min(resource.memory_usage || 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricBox
          title="Avg Duration"
          value={`${data.stats.avg_duration_seconds.toFixed(2)}s`}
          icon={<Clock size={20} />}
        />
        <MetricBox
          title="Throughput"
          value={`${data.stats.completed} tasks/session`}
          icon={<Zap size={20} />}
        />
        <MetricBox
          title="Capacity"
          value={`${Math.round((data.stats.running / (data.stats.queued + data.stats.running + 1)) * 100)}%`}
          icon={<Activity size={20} />}
        />
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-lg p-4 text-white`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="opacity-80">{icon}</div>
      </div>
      <p className="text-sm opacity-90">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}

interface MetricBoxProps {
  title: string
  value: string
  icon: React.ReactNode
}

function MetricBox({ title, value, icon }: MetricBoxProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        {icon}
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}
