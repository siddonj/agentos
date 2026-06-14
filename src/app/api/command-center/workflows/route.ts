import { NextRequest, NextResponse } from 'next/server'
import { createWorkflow, getWorkflows, updateWorkflowStatus, deleteWorkflow } from '@/lib/command-center/workflow-manager'

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status')
    const workflows = getWorkflows(status || undefined)

    return NextResponse.json({
      success: true,
      workflows,
      count: workflows.length,
    })
  } catch (error) {
    console.error('Workflows GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch workflows' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, trigger_type, trigger_condition, created_by } = body

    if (!name || !trigger_type || !created_by) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const id = createWorkflow({
      name,
      description: description || '',
      trigger_type,
      trigger_condition: trigger_condition || '',
      status: 'active',
      created_by,
    })

    return NextResponse.json({
      success: true,
      workflow_id: id,
      message: 'Workflow created successfully',
    })
  } catch (error) {
    console.error('Workflows POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create workflow' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { workflow_id, status } = body

    if (!workflow_id || !status) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    updateWorkflowStatus(workflow_id, status)

    return NextResponse.json({
      success: true,
      message: `Workflow ${workflow_id} status updated to ${status}`,
    })
  } catch (error) {
    console.error('Workflows PUT error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update workflow' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { workflow_id } = body

    if (!workflow_id) {
      return NextResponse.json({ success: false, error: 'Missing workflow_id' }, { status: 400 })
    }

    deleteWorkflow(workflow_id)

    return NextResponse.json({
      success: true,
      message: `Workflow ${workflow_id} deleted`,
    })
  } catch (error) {
    console.error('Workflows DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete workflow' }, { status: 500 })
  }
}
