import { NextRequest, NextResponse } from 'next/server'

// Demo data - in-memory storage
let demoState = {
  agents: [
    { agent: 'Claude', status: 'idle', last_updated: new Date().toISOString(), metrics: { total: 0, completed: 0, failed: 0, success_rate: 0, avg_duration: 0 } },
    { agent: 'Hermes', status: 'idle', last_updated: new Date().toISOString(), metrics: { total: 0, completed: 0, failed: 0, success_rate: 0, avg_duration: 0 } },
    { agent: 'Zapier', status: 'idle', last_updated: new Date().toISOString(), metrics: { total: 0, completed: 0, failed: 0, success_rate: 0, avg_duration: 0 } },
    { agent: 'Learning', status: 'idle', last_updated: new Date().toISOString(), metrics: { total: 0, completed: 0, failed: 0, success_rate: 0, avg_duration: 0 } },
  ],
  tasks: { pending: 0, in_progress: 0 },
  activities: [] as any[],
  totalCost: 0,
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      agents: demoState.agents,
      tasks: {
        pending: demoState.tasks.pending,
        in_progress: demoState.tasks.in_progress,
        total_pending_and_active: demoState.tasks.pending + demoState.tasks.in_progress,
      },
      recent_activity: demoState.activities,
      cost_7_days: demoState.totalCost,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Control room API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch control room status',
      },
      { status: 500 }
    )
  }
}

