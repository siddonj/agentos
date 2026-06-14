'use client'

import { useEffect, useState } from 'react'
import { Play, Pause, Trash2, Plus, Zap, GitBranch, Clock } from 'lucide-react'

interface Workflow {
  id: number
  name: string
  description: string
  trigger_type: string
  status: 'active' | 'paused' | 'archived'
  created_at: string
}

interface Integration {
  id: number
  name: string
  type: string
  provider: string
  status: string
  last_sync?: string
}

interface Stats {
  total_workflows: number
  active_workflows: number
  completed_tasks: number
  failed_tasks: number
}

interface CommandCenterData {
  workflows: Workflow[]
  integrations: Integration[]
  stats: Stats
}

export default function CommandCenter() {
  const [data, setData] = useState<CommandCenterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'workflows' | 'integrations'>('workflows')
  const [workflowForm, setWorkflowForm] = useState({ name: '', description: '', trigger_type: 'manual' })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/command-center/status')
        const result = await response.json()
        if (result.success) {
          setData(result)
        } else {
          setError('Failed to load command center data')
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

  const handleCreateWorkflow = async () => {
    if (!workflowForm.name) {
      alert('Workflow name is required')
      return
    }

    try {
      const response = await fetch('/api/command-center/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...workflowForm,
          created_by: 'system',
        }),
      })

      const result = await response.json()
      if (result.success) {
        setWorkflowForm({ name: '', description: '', trigger_type: 'manual' })
        // Refresh data
        const refreshResponse = await fetch('/api/command-center/status')
        const refreshResult = await refreshResponse.json()
        setData(refreshResult)
      } else {
        alert('Failed to create workflow')
      }
    } catch (err) {
      alert('Error creating workflow')
      console.error(err)
    }
  }

  const handleWorkflowAction = async (workflowId: number, action: 'pause' | 'delete') => {
    try {
      if (action === 'pause') {
        await fetch('/api/command-center/workflows', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflow_id: workflowId,
            status: 'paused',
          }),
        })
      } else if (action === 'delete') {
        await fetch('/api/command-center/workflows', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow_id: workflowId }),
        })
      }

      // Refresh data
      const response = await fetch('/api/command-center/status')
      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Error updating workflow:', err)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Loading command center...</p>
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

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Command Center</h1>
        <p className="text-slate-400">Orchestrate workflows, manage integrations, coordinate agents</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Workflows" value={data.stats.total_workflows} icon={<GitBranch size={24} />} color="from-blue-500 to-cyan-600" />
        <StatCard label="Active Workflows" value={data.stats.active_workflows} icon={<Zap size={24} />} color="from-green-500 to-emerald-600" />
        <StatCard label="Tasks Completed" value={data.stats.completed_tasks} icon={<Clock size={24} />} color="from-purple-500 to-pink-600" />
        <StatCard label="Failed Tasks" value={data.stats.failed_tasks} icon={<Zap size={24} />} color="from-red-500 to-orange-600" />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('workflows')}
          className={`pb-4 px-4 font-semibold transition ${
            activeTab === 'workflows' ? 'text-white border-b-2 border-cyan-500' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Workflows
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`pb-4 px-4 font-semibold transition ${
            activeTab === 'integrations' ? 'text-white border-b-2 border-cyan-500' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Integrations ({data.integrations.length})
        </button>
      </div>

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          {/* Create Workflow Form */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Create New Workflow</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Workflow name"
                value={workflowForm.name}
                onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400"
              />
              <input
                type="text"
                placeholder="Description"
                value={workflowForm.description}
                onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400"
              />
              <select
                value={workflowForm.trigger_type}
                onChange={(e) => setWorkflowForm({ ...workflowForm, trigger_type: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              >
                <option value="manual">Manual</option>
                <option value="scheduled">Scheduled</option>
                <option value="webhook">Webhook</option>
                <option value="event">Event</option>
              </select>
              <button
                onClick={handleCreateWorkflow}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 rounded transition flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Create Workflow
              </button>
            </div>
          </div>

          {/* Workflows List */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Active Workflows</h3>
            <div className="space-y-3">
              {data.workflows.length > 0 ? (
                data.workflows.map((workflow) => (
                  <div key={workflow.id} className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{workflow.name}</h4>
                      <p className="text-sm text-slate-400 mt-1">{workflow.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">{workflow.trigger_type}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            workflow.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : workflow.status === 'paused'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {workflow.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleWorkflowAction(workflow.id, 'pause')}
                        className="p-2 hover:bg-slate-700 rounded transition text-slate-400 hover:text-slate-300"
                      >
                        <Pause size={18} />
                      </button>
                      <button
                        onClick={() => handleWorkflowAction(workflow.id, 'delete')}
                        className="p-2 hover:bg-red-500/20 rounded transition text-slate-400 hover:text-red-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No workflows yet. Create one above.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Connected Integrations</h3>
          <div className="space-y-3">
            {data.integrations.length > 0 ? (
              data.integrations.map((integration) => (
                <div key={integration.id} className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-white font-semibold">{integration.name}</h4>
                      <p className="text-sm text-slate-400 mt-1">{integration.provider}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">{integration.type}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            integration.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : integration.status === 'testing'
                                ? 'bg-amber-500/20 text-amber-400'
                                : integration.status === 'error'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {integration.status}
                        </span>
                      </div>
                    </div>
                    {integration.last_sync && <p className="text-xs text-slate-500">Last sync: {new Date(integration.last_sync).toLocaleString()}</p>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No integrations connected yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  color: string
}

function StatCard({ label, value, icon, color }: StatCardProps) {
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
