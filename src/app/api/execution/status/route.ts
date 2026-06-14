import { NextRequest, NextResponse } from 'next/server'
import { getQueueStats, getExecutionQueue, getResourceAllocations, initializeDefaultResources } from '@/lib/execution/execution-engine'

export async function GET(request: NextRequest) {
  try {
    // Initialize default resources if not already done
    initializeDefaultResources()

    const stats = getQueueStats()
    const queue = getExecutionQueue()
    const resources = getResourceAllocations()

    return NextResponse.json({
      success: true,
      stats,
      queue,
      resources,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Execution status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch execution status',
      },
      { status: 500 }
    )
  }
}
