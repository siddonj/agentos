import { NextRequest, NextResponse } from 'next/server'
import { getAuthorityDashboardData, aggregateAuthorityMetrics } from '@/lib/authority/authority-tracker'

export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0]
    aggregateAuthorityMetrics(today)

    const data = getAuthorityDashboardData()

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Authority metrics API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch authority metrics',
      },
      { status: 500 }
    )
  }
}
