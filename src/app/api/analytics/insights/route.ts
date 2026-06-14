import { NextRequest, NextResponse } from 'next/server'
import { getAnalyticsDashboardData, getRecommendations, getForecasts, generateInsights } from '@/lib/analytics/insights-engine'

export async function GET(request: NextRequest) {
  try {
    const dashboardData = getAnalyticsDashboardData()

    // Generate insights based on current metrics
    generateInsights(dashboardData.total_activities, 4.5, 82, 55)

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Analytics insights error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics insights',
      },
      { status: 500 }
    )
  }
}
