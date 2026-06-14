export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Mission Control
          </h1>
          <p className="text-xl text-slate-300">
            Your Agentic Operating System is starting up...
          </p>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Phase 0 Status */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Phase 0: Context Layer</h3>
                <p className="text-sm text-slate-400">Persistent Business Context</p>
              </div>
              <div className="px-3 py-1 bg-green-900/30 border border-green-700 rounded-full">
                <span className="text-xs font-semibold text-green-300">✅ Ready</span>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>✅ Business context layer</li>
              <li>✅ Dashboard tab wired</li>
              <li>✅ API endpoints ready</li>
            </ul>
          </div>

          {/* Phase 1 Status */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur opacity-50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Phase 1: Learning System</h3>
                <p className="text-sm text-slate-400">Real-Time Analytics</p>
              </div>
              <div className="px-3 py-1 bg-gray-900/30 border border-gray-700 rounded-full">
                <span className="text-xs font-semibold text-gray-400">⊘ Disabled</span>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>⊘ Learning logger</li>
              <li>⊘ Pattern analyzer</li>
              <li>⊘ Analytics dashboard</li>
            </ul>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-300 mb-3">Next Steps</h3>
          <ol className="space-y-2 text-sm text-blue-200 list-decimal list-inside">
            <li>Open the <strong>Business Context</strong> tab to configure your business</li>
            <li>Create vault files: <code className="bg-black/30 px-2 py-1 rounded">vault/business/context.md</code></li>
            <li>Test: navigate to <strong>Business Context</strong> tab</li>
            <li>Enable Phase 1 when ready (Real-Time Learning System)</li>
          </ol>
        </div>

        {/* Quick Links */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
          <div className="flex flex-wrap gap-3">
            <a
              href="/business-context"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm"
            >
              → Business Context Tab
            </a>
            <a
              href="#"
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg opacity-50 cursor-not-allowed font-medium text-sm"
              title="Available after Phase 1 setup"
            >
              Analytics (Phase 1)
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-slate-500">
          <p>Agent OS v1.0.0 — Phase 0 (Context Layer)</p>
          <p className="mt-2">Phases 1-6 ready to build. Follow STEP 3 in setup guide.</p>
        </div>
      </div>
    </div>
  )
}
