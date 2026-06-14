import { NextRequest, NextResponse } from 'next/server'
import { enqueueTask, getExecutionQueue, startTaskExecution, completeTaskExecution, failTaskExecution, dequeueNextTask } from '@/lib/execution/execution-engine'

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status')
    const queue = getExecutionQueue(status || undefined)

    return NextResponse.json({
      success: true,
      queue,
      count: queue.length,
    })
  } catch (error) {
    console.error('Queue GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch queue' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, task_id, priority, workflow_id, queue_id, agent, error, result } = body

    switch (action) {
      case 'enqueue':
        if (!task_id) return NextResponse.json({ success: false, error: 'Missing task_id' }, { status: 400 })
        const queueId = enqueueTask(task_id, priority || 5, workflow_id)
        return NextResponse.json({
          success: true,
          queue_id: queueId,
          message: 'Task enqueued',
        })

      case 'dequeue':
        const next = dequeueNextTask()
        if (!next) {
          return NextResponse.json({
            success: true,
            queue_item: null,
            message: 'No tasks in queue',
          })
        }
        return NextResponse.json({
          success: true,
          queue_item: next,
        })

      case 'start':
        if (!queue_id) return NextResponse.json({ success: false, error: 'Missing queue_id' }, { status: 400 })
        startTaskExecution(queue_id)
        return NextResponse.json({
          success: true,
          message: 'Task execution started',
        })

      case 'complete':
        if (!queue_id) return NextResponse.json({ success: false, error: 'Missing queue_id' }, { status: 400 })
        completeTaskExecution(queue_id, result)
        return NextResponse.json({
          success: true,
          message: 'Task execution completed',
        })

      case 'fail':
        if (!queue_id || !error) return NextResponse.json({ success: false, error: 'Missing queue_id or error' }, { status: 400 })
        failTaskExecution(queue_id, error)
        return NextResponse.json({
          success: true,
          message: 'Task marked as failed',
        })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Queue POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update queue' }, { status: 500 })
  }
}
