import { NextRequest, NextResponse } from 'next/server'
import { logMediaMention, logSpeakingEvent, aggregateAuthorityMetrics } from '@/lib/authority/authority-tracker'

export async function GET(request: NextRequest) {
  try {
    // Populate demo media mentions
    const mentions = [
      {
        date_published: '2026-06-12',
        title: 'The Future of Agentic AI Systems',
        outlet: 'TechCrunch',
        mention_type: 'article',
        url: 'https://techcrunch.com/article1',
        reach: 45000,
        notes: 'Featured in main column',
      },
      {
        date_published: '2026-06-10',
        title: 'Building Thought Leadership with AI',
        outlet: 'Forbes',
        mention_type: 'interview',
        url: 'https://forbes.com/interview1',
        reach: 120000,
        notes: 'Executive roundtable',
      },
      {
        date_published: '2026-06-08',
        title: 'AI Agents in Enterprise Settings',
        outlet: 'MIT Technology Review',
        mention_type: 'podcast',
        url: 'https://mitreview.com/podcast',
        reach: 35000,
        notes: '45-minute interview',
      },
      {
        date_published: '2026-06-05',
        title: 'Autonomous Systems and Human Judgment',
        outlet: 'Harvard Business Review',
        mention_type: 'article',
        url: 'https://hbr.org/article',
        reach: 250000,
        notes: 'Long-form research piece',
      },
      {
        date_published: '2026-06-01',
        title: 'Next-Gen Automation Tools',
        outlet: 'Wired',
        mention_type: 'feature',
        url: 'https://wired.com/feature',
        reach: 180000,
        notes: 'Product feature spotlight',
      },
    ]

    for (const mention of mentions) {
      logMediaMention(mention as any)
    }

    // Populate demo speaking events
    const events = [
      {
        event_name: 'AI Summit 2026',
        event_date: '2026-07-15',
        event_type: 'conference',
        platform: 'In-person (San Francisco)',
        audience_size: 500,
        topic: 'Building Autonomous Systems at Scale',
        status: 'scheduled' as const,
        recording_url: '',
      },
      {
        event_name: 'Enterprise AI Webinar Series',
        event_date: '2026-07-01',
        event_type: 'webinar',
        platform: 'Zoom',
        audience_size: 2000,
        topic: 'Implementing Agentic AI in Your Organization',
        status: 'scheduled' as const,
        recording_url: '',
      },
      {
        event_name: 'Tech Leaders Panel',
        event_date: '2026-06-28',
        event_type: 'panel',
        platform: 'LinkedIn Live',
        audience_size: 5000,
        topic: 'The Future of Work with AI Agents',
        status: 'scheduled' as const,
        recording_url: '',
      },
      {
        event_name: 'Startup Accelerator Demo Day',
        event_date: '2026-05-20',
        event_type: 'speaking',
        platform: 'In-person (NYC)',
        audience_size: 300,
        topic: 'Funding AI-First Companies',
        status: 'completed' as const,
        recording_url: 'https://youtube.com/watch?v=demo1',
      },
      {
        event_name: 'Industry Conference Keynote',
        event_date: '2026-05-10',
        event_type: 'keynote',
        platform: 'In-person (Austin)',
        audience_size: 1200,
        topic: 'The Next Wave of Enterprise Automation',
        status: 'completed' as const,
        recording_url: 'https://youtube.com/watch?v=demo2',
      },
    ]

    for (const event of events) {
      logSpeakingEvent(event)
    }

    // Aggregate metrics for multiple days to show trends
    const dates = [
      '2026-06-08',
      '2026-06-09',
      '2026-06-10',
      '2026-06-11',
      '2026-06-12',
      '2026-06-13',
      '2026-06-14',
    ]

    for (const date of dates) {
      aggregateAuthorityMetrics(date)
    }

    return NextResponse.json({
      success: true,
      message: 'Demo authority data populated successfully',
      info: 'Go to /authority to see the dashboard',
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
