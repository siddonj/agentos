import { NextRequest, NextResponse } from 'next/server'
import { createStrategicPlan, addRecommendation, addForecast, StrategicPlan, Recommendation, PerformanceForecast } from '@/lib/analytics/insights-engine'

export async function GET(request: NextRequest) {
  try {
    // Create demo strategic plans
    const plans: StrategicPlan[] = [
      {
        title: 'Q3 Authority Building Initiative',
        objective: 'Increase authority score from 55 to 80 through strategic media and speaking',
        timeline_days: 90,
        target_metrics: { authority_score: 80, media_mentions: 15, speaking_events: 5 },
        status: 'active' as const,
        priority: 9,
      },
      {
        title: 'Content Velocity Acceleration',
        objective: 'Scale from 3 to 8 posts per week across all channels',
        timeline_days: 30,
        target_metrics: { posts_per_week: 8, engagement_rate: 6.5, reach: 50000 },
        status: 'active' as const,
        priority: 8,
      },
      {
        title: 'Thought Leadership Ecosystem',
        objective: 'Build a comprehensive thought leadership engine with automation',
        timeline_days: 180,
        target_metrics: { followers: 25000, monthly_reach: 500000, partnerships: 10 },
        status: 'active' as const,
        priority: 10,
      },
    ]

    for (const plan of plans) {
      createStrategicPlan(plan)
    }

    // Create demo recommendations
    const recommendations: Recommendation[] = [
      {
        category: 'Authority',
        title: 'Accelerate Authority Building',
        description: 'Schedule 2-3 high-impact speaking engagements at major conferences',
        priority: 'high' as const,
        impact_score: 9.2,
        implementation_effort: 'hard' as const,
      },
      {
        category: 'Content',
        title: 'Increase Content Frequency',
        description: 'Scale from 3 to 8 posts per week for optimal reach and engagement',
        priority: 'high' as const,
        impact_score: 8.5,
        implementation_effort: 'easy' as const,
      },
      {
        category: 'Engagement',
        title: 'Interactive Content Strategy',
        description: 'Focus on Q&As, polls, and real-time discussions to boost engagement',
        priority: 'high' as const,
        impact_score: 7.8,
        implementation_effort: 'medium' as const,
      },
      {
        category: 'Channels',
        title: 'YouTube Thought Leadership',
        description: 'Launch a YouTube channel with weekly insights and behind-the-scenes content',
        priority: 'medium' as const,
        impact_score: 7.5,
        implementation_effort: 'hard' as const,
      },
      {
        category: 'Operations',
        title: 'Workflow Optimization',
        description: 'Streamline content creation pipeline to reduce time-to-publish by 40%',
        priority: 'medium' as const,
        impact_score: 6.5,
        implementation_effort: 'medium' as const,
      },
    ]

    for (const rec of recommendations) {
      addRecommendation(rec)
    }

    // Create demo performance forecasts
    const forecasts: PerformanceForecast[] = [
      {
        metric_name: 'Followers',
        forecast_date: '2026-07-14',
        predicted_value: 5500,
        confidence_level: 0.92,
        trend: 'up' as const,
      },
      {
        metric_name: 'Followers',
        forecast_date: '2026-08-14',
        predicted_value: 6800,
        confidence_level: 0.87,
        trend: 'up' as const,
      },
      {
        metric_name: 'Monthly Reach',
        forecast_date: '2026-07-14',
        predicted_value: 45000,
        confidence_level: 0.89,
        trend: 'up' as const,
      },
      {
        metric_name: 'Monthly Reach',
        forecast_date: '2026-08-14',
        predicted_value: 58000,
        confidence_level: 0.85,
        trend: 'up' as const,
      },
      {
        metric_name: 'Engagement Rate',
        forecast_date: '2026-07-14',
        predicted_value: 5.2,
        confidence_level: 0.88,
        trend: 'up' as const,
      },
      {
        metric_name: 'Authority Score',
        forecast_date: '2026-07-14',
        predicted_value: 62,
        confidence_level: 0.91,
        trend: 'up' as const,
      },
    ]

    for (const forecast of forecasts) {
      addForecast(forecast)
    }

    return NextResponse.json({
      success: true,
      message: 'Demo analytics data populated successfully',
      info: 'Go to /analytics-planning to see the dashboard',
      plans_created: plans.length,
      recommendations_created: recommendations.length,
      forecasts_created: forecasts.length,
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
