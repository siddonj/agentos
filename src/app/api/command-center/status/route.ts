import { NextRequest, NextResponse } from 'next/server'
import { getWorkflows, getIntegrations, getWorkflowStats } from '@/lib/command-center/workflow-manager'

export async function GET(request: NextRequest) {
  try {
    const workflows = getWorkflows()
    const integrations = getIntegrations()
    const stats = getWorkflowStats()

    return NextResponse.json({
      success: true,
      workflows,
      integrations,
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Command center status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch command center status',
      },
      { status: 500 }
    )
  }
}
