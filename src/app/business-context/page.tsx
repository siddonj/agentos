'use client'

import { useState, useEffect } from 'react'
import { BookOpen, AlertCircle, Loader } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface ContextData {
  business?: string
  agents?: string
  tools?: string
  error?: string
}

export default function BusinessContextPage() {
  const [context, setContext] = useState<ContextData>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'business' | 'agents' | 'tools'>('business')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchContext()
  }, [])

  const fetchContext = async () => {
    try {
      setLoading(true)
      setError(null)

      const [businessRes, agentsRes, toolsRes] = await Promise.all([
        fetch('/api/context/business'),
        fetch('/api/context/agents'),
        fetch('/api/context/tools'),
      ])

      if (!businessRes.ok) throw new Error(`Failed to fetch business context: ${businessRes.statusText}`)
      if (!agentsRes.ok) throw new Error(`Failed to fetch agents: ${agentsRes.statusText}`)
      if (!toolsRes.ok) throw new Error(`Failed to fetch tools: ${toolsRes.statusText}`)

      const businessData = await businessRes.json()
      const agentsData = await agentsRes.json()
      const toolsData = await toolsRes.json()

      setContext({
        business: businessData.content,
        agents: agentsData.content,
        tools: toolsData.content,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load context'
      setError(errorMessage)
      console.error('Error loading context:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Loading Business Context...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-amber-400" />
            <h1 className="text-3xl font-bold text-white">Business Context</h1>
          </div>
          <p className="text-slate-400">The foundation all agents read from before working</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-semibold">Error Loading Context</p>
              <p className="text-red-200 text-sm">{error}</p>
              <button
                onClick={fetchContext}
                className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          {(['business', 'agents', 'tools'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold transition ${
                activeTab === tab
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab === 'business' && 'Business Constitution'}
              {tab === 'agents' && 'Agent Team'}
              {tab === 'tools' && 'Tools Registry'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur">
          {activeTab === 'business' && context.business && (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{context.business}</ReactMarkdown>
            </div>
          )}
          {activeTab === 'agents' && context.agents && (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{context.agents}</ReactMarkdown>
            </div>
          )}
          {activeTab === 'tools' && context.tools && (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{context.tools}</ReactMarkdown>
            </div>
          )}

          {!context.business && !context.agents && !context.tools && (
            <div className="text-slate-400 text-center py-8">
              <p>No context files found. Have you created vault files yet?</p>
              <p className="text-sm mt-2">
                Create: vault/business/context.md, vault/automation/agents.md, vault/automation/tools-registry.md
              </p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>How this works:</strong> All agents (Claude, Hermes, Learning System) read these files before executing tasks. This ensures they understand your business, positioning, and constraints.
          </p>
        </div>

        {/* Reload Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={fetchContext}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded transition"
          >
            Refresh Context
          </button>
        </div>
      </div>
    </div>
  )
}
