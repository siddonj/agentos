import { NextRequest, NextResponse } from 'next/server'
import { createWorkflow, addWorkflowTask, registerIntegration } from '@/lib/command-center/workflow-manager'

export async function GET(request: NextRequest) {
  try {
    // Create demo workflows
    const workflows = [
      {
        name: 'Daily Content Generation',
        description: 'Automatically generate and publish daily content posts',
        trigger_type: 'scheduled',
        trigger_condition: 'Every day at 9:00 AM',
        created_by: 'system',
      },
      {
        name: 'Lead Enrichment Pipeline',
        description: 'Enrich incoming leads with market data and engagement history',
        trigger_type: 'webhook',
        trigger_condition: 'On new lead form submission',
        created_by: 'system',
      },
      {
        name: 'Social Media Monitoring',
        description: 'Monitor brand mentions and respond to engagement',
        trigger_type: 'scheduled',
        trigger_condition: 'Every 4 hours',
        created_by: 'system',
      },
      {
        name: 'Report Generation',
        description: 'Generate weekly authority and engagement reports',
        trigger_type: 'scheduled',
        trigger_condition: 'Every Friday at 5:00 PM',
        created_by: 'system',
      },
    ]

    for (const workflow of workflows) {
      const workflowId = createWorkflow(workflow as any)

      // Add tasks to each workflow
      if (workflow.name === 'Daily Content Generation') {
        addWorkflowTask({
          workflow_id: workflowId,
          step_order: 1,
          agent: 'Claude',
          action: 'generate_content',
          parameters: { topic: 'Auto', content_type: 'blog_post' },
          status: 'pending',
        })
        addWorkflowTask({
          workflow_id: workflowId,
          step_order: 2,
          agent: 'Hermes',
          action: 'publish_to_channels',
          parameters: { channels: ['twitter', 'linkedin', 'medium'] },
          status: 'pending',
        })
      } else if (workflow.name === 'Lead Enrichment Pipeline') {
        addWorkflowTask({
          workflow_id: workflowId,
          step_order: 1,
          agent: 'Zapier',
          action: 'extract_lead_data',
          parameters: { fields: ['email', 'company', 'role'] },
          status: 'pending',
        })
        addWorkflowTask({
          workflow_id: workflowId,
          step_order: 2,
          agent: 'Learning',
          action: 'enrich_with_insights',
          parameters: { data_sources: ['crunchbase', 'linkedin'] },
          status: 'pending',
        })
        addWorkflowTask({
          workflow_id: workflowId,
          step_order: 3,
          agent: 'Zapier',
          action: 'sync_to_crm',
          parameters: { crm: 'hubspot' },
          status: 'pending',
        })
      }
    }

    // Register demo integrations
    const integrations = [
      {
        name: 'Zapier',
        type: 'zapier',
        provider: 'Zapier Inc.',
        status: 'active',
        config: {
          webhook_url: 'https://hooks.zapier.com/...',
          sync_interval: 300,
        },
      },
      {
        name: 'HubSpot CRM',
        type: 'api',
        provider: 'HubSpot',
        status: 'active',
        config: {
          api_endpoint: 'https://api.hubapi.com',
          rate_limit: 100,
        },
      },
      {
        name: 'Twitter/X API',
        type: 'api',
        provider: 'Twitter',
        status: 'active',
        config: {
          api_version: 'v2',
          endpoints: ['tweets', 'users', 'search'],
        },
      },
      {
        name: 'LinkedIn API',
        type: 'api',
        provider: 'LinkedIn',
        status: 'configured',
        config: {
          api_endpoint: 'https://api.linkedin.com/v2',
          scopes: ['w_member_social', 'r_liteprofile'],
        },
      },
      {
        name: 'Medium API',
        type: 'api',
        provider: 'Medium',
        status: 'active',
        config: {
          publication_id: 'auto',
          draft_mode: false,
        },
      },
    ]

    for (const integration of integrations) {
      registerIntegration(integration as any)
    }

    return NextResponse.json({
      success: true,
      message: 'Demo command center data populated successfully',
      info: 'Go to /command-center to see the dashboard',
      workflows_created: workflows.length,
      integrations_created: integrations.length,
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
