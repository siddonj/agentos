import { NextRequest, NextResponse } from 'next/server'
import { getActivePatterns, getPatternsByType } from '@/lib/learning/pattern-analyzer'
import { getDatabase } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type')

    let patterns
    if (type) {
      patterns = getPatternsByType(type)
    } else {
      patterns = getActivePatterns()
    }

    const recommendations = generateRecommendations(patterns)
    const metrics = getMetrics()

    return NextResponse.json({
      success: true,
      patterns,
      recommendations,
      metrics,
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Learning API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch insights',
      },
      { status: 500 }
    )
  }
}

function generateRecommendations(patterns: any[]): string[] {
  const recommendations: string[] = []

  const byType: Record<string, any[]> = {}
  for (const pattern of patterns) {
    if (!byType[pattern.pattern_type]) {
      byType[pattern.pattern_type] = []
    }
    byType[pattern.pattern_type].push(pattern)
  }

  if (byType.topic && byType.topic.length > 0) {
    const topTopic = byType.topic[0]
    const count = Math.ceil(topTopic.data.engagement_score * 2)
    recommendations.push(
      `Write ${count} more posts on "${topTopic.data.topic}" (gets ${topTopic.data.engagement_score.toFixed(1)}x engagement)`
    )
  }

  if (byType.channel && byType.channel.length > 0) {
    const topChannel = byType.channel[0]
    recommendations.push(
      `Focus on ${topChannel.data.channel} (${(topChannel.data.effectiveness_multiplier * 100).toFixed(0)}% more effective)`
    )
  }

  if (byType.content_type && byType.content_type.length > 0) {
    const topType = byType.content_type[0]
    recommendations.push(
      `Use ${topType.data.content_type} format (gets ${topType.data.effectiveness.toFixed(1)}x engagement)`
    )
  }

  if (byType.timing && byType.timing.length > 0) {
    const topTime = byType.timing[0]
    recommendations.push(
      `Post on ${topTime.data.day}s for ${(topTime.data.multiplier * 100 - 100).toFixed(0)}% more engagement`
    )
  }

  return recommendations
}

function getMetrics() {
  try {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as total_posts,
        SUM(COALESCE(impressions, 0)) as total_impressions,
        AVG(COALESCE(engagement_rate, 0)) as avg_engagement,
        SUM(COALESCE(new_followers, 0)) as follower_growth
      FROM analytics
      WHERE date >= DATE('now', '-7 days')
    `)

    const metrics = stmt.get() as any

    return {
      total_posts: metrics?.total_posts || 0,
      total_impressions: metrics?.total_impressions || 0,
      avg_engagement: ((metrics?.avg_engagement || 0) * 100).toFixed(1),
      follower_growth: metrics?.follower_growth || 0,
    }
  } catch (error) {
    console.error('Metrics error:', error)
    return { total_posts: 0, total_impressions: 0, avg_engagement: 0, follower_growth: 0 }
  }
}
