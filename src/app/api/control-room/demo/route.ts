import { NextRequest, NextResponse } from 'next/server'
import { createTask, updateTaskStatus } from '@/lib/control-room/task-queue'
import { reportAgentStatus } from '@/lib/control-room/agent-monitor'
import { logActivity } from '@/lib/control-room/activity-logger'

export async function GET(request: NextRequest) {
  try {
    // Create demo tasks and activities
    await populateDemoData()

    return NextResponse.json({
      success: true,
      message: 'Demo data populated successfully',
      info: 'Go to /control-room to see live agents and tasks',
    })
  } catch (error) {
    console.error('Demo population error:', error)
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

async function populateDemoData() {
  // Task data for each agent
  const tasksData = [
    {
      agent: 'Claude',
      task_type: 'research',
      description: 'Research AI compliance frameworks',
      duration: 245,
      status: 'completed' as const,
      result: 'Found 3 major compliance frameworks',
    },
    {
      agent: 'Claude',
      task_type: 'draft',
      description: 'Draft blog post on AI ethics',
      duration: 180,
      status: 'completed' as const,
      result: 'Draft completed - 1200 words',
    },
    {
      agent: 'Claude',
      task_type: 'research',
      description: 'Research latest ML regulations',
      duration: 120,
      status: 'in-progress' as const,
      result: undefined,
    },
    {
      agent: 'Hermes',
      task_type: 'publish',
      description: 'Publish to Medium',
      duration: 45,
      status: 'completed' as const,
      result: 'Published - 2,400 impressions',
    },
    {
      agent: 'Hermes',
      task_type: 'publish',
      description: 'Publish to LinkedIn',
      duration: 30,
      status: 'completed' as const,
      result: 'Published - 450 likes',
    },
    {
      agent: 'Hermes',
      task_type: 'schedule',
      description: 'Schedule Twitter thread',
      duration: 20,
      status: 'completed' as const,
      result: 'Scheduled for 9am tomorrow',
    },
    {
      agent: 'Zapier',
      task_type: 'trigger',
      description: 'Process webhook from form',
      duration: 15,
      status: 'completed' as const,
      result: 'Email sent to user',
    },
    {
      agent: 'Zapier',
      task_type: 'sync',
      description: 'Sync CRM with analytics',
      duration: 60,
      status: 'completed' as const,
      result: 'Synced 125 records',
    },
    {
      agent: 'Learning',
      task_type: 'analyze',
      description: 'Analyze content patterns',
      duration: 90,
      status: 'completed' as const,
      result: 'Found 3 high-performing topics',
    },
    {
      agent: 'Learning',
      task_type: 'report',
      description: 'Generate daily summary',
      duration: 45,
      status: 'completed' as const,
      result: 'Report generated',
    },
  ]

  // Create tasks and log activities
  for (const taskData of tasksData) {
    const task = await createTask({
      agent: taskData.agent,
      task_type: taskData.task_type,
      description: taskData.description,
    })

    if (taskData.status === 'in-progress') {
      // Start the task
      await updateTaskStatus(task.id, 'in-progress')
      await reportAgentStatus(taskData.agent, 'working' as any, {
        current_task: taskData.description,
      })

      await logActivity({
        agent: taskData.agent,
        action: `${taskData.task_type}_started`,
        task_id: task.id,
        status: 'success',
      })
    } else {
      // Complete the task
      await updateTaskStatus(task.id, 'in-progress')

      await logActivity({
        agent: taskData.agent,
        action: `${taskData.task_type}_started`,
        task_id: task.id,
        status: 'success',
      })

      // Simulate some processing time has passed
      const completedTask = await updateTaskStatus(task.id, 'completed', taskData.result)

      await logActivity({
        agent: taskData.agent,
        action: `${taskData.task_type}_completed`,
        task_id: task.id,
        duration_seconds: taskData.duration,
        status: 'success',
        cost: Math.random() * 0.1, // Random small cost
      })
    }
  }

  // Set final agent statuses
  await reportAgentStatus('Claude', 'researching' as any, {
    current_task: 'Research latest ML regulations',
  })
  await reportAgentStatus('Hermes', 'idle')
  await reportAgentStatus('Zapier', 'idle')
  await reportAgentStatus('Learning', 'idle')
}
