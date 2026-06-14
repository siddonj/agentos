import { NextRequest, NextResponse } from 'next/server'
import { registerIntegration, getIntegrations, updateIntegrationStatus } from '@/lib/command-center/workflow-manager'

export async function GET(request: NextRequest) {
  try {
    const integrations = getIntegrations()

    return NextResponse.json({
      success: true,
      integrations,
      count: integrations.length,
    })
  } catch (error) {
    console.error('Integrations GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch integrations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, provider, config } = body

    if (!name || !type || !provider) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const id = registerIntegration({
      name,
      type,
      provider,
      status: 'configured',
      config: config || {},
    })

    return NextResponse.json({
      success: true,
      integration_id: id,
      message: 'Integration registered successfully',
    })
  } catch (error) {
    console.error('Integrations POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to register integration' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { integration_id, status } = body

    if (!integration_id || !status) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    updateIntegrationStatus(integration_id, status)

    return NextResponse.json({
      success: true,
      message: `Integration ${integration_id} status updated to ${status}`,
    })
  } catch (error) {
    console.error('Integrations PUT error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update integration' }, { status: 500 })
  }
}
