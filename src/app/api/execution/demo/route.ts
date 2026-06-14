import { NextRequest, NextResponse } from 'next/server'
import { enqueueTask, initializeDefaultResources, updateResourceUsage } from '@/lib/execution/execution-engine'

export async function GET(request: NextRequest) {
  try {
    // Initialize default resources for all agents
    initializeDefaultResources()

    // Enqueue sample tasks with varying priorities
    const taskIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const priorities = [8, 6, 5, 5, 4, 4, 3, 3, 2, 1]
    const agents = ['Claude', 'Hermes', 'Zapier', 'Learning']

    for (let i = 0; i < taskIds.length; i++) {
      enqueueTask(taskIds[i], priorities[i])
    }

    // Simulate some resource usage
    updateResourceUsage('Claude', 2, 45.5, 62.3)
    updateResourceUsage('Hermes', 1, 22.1, 38.7)
    updateResourceUsage('Zapier', 3, 78.9, 85.2)
    updateResourceUsage('Learning', 1, 35.4, 51.2)

    return NextResponse.json({
      success: true,
      message: 'Demo execution data populated successfully',
      info: 'Go to /execution to see the monitor',
      tasks_enqueued: taskIds.length,
      resources_allocated: agents.length,
    })
  } catch (error) {
    console.error('Demo data population error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to populate demo data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
