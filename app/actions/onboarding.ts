'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  onboardingProgress,
  workflowRun,
  workflowStep,
  emailLog,
} from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getUserId() {
  // Using demo user ID since auth.api not configured
  return 'user_demo'
  // const session = await auth.api.getSession({ headers: await headers() })
  // if (!session?.user) throw new Error('Unauthorized')
  // return session.user.id
}

export async function updateOnboardingProgress(
  stepId: string,
  completed: boolean
) {
  const userId = await getUserId()

  const existing = await db
    .select()
    .from(onboardingProgress)
    .where(
      and(eq(onboardingProgress.userId, userId), eq(onboardingProgress.stepId, stepId))
    )

  if (existing.length > 0) {
    await db
      .update(onboardingProgress)
      .set({
        completed,
        completedAt: completed ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(onboardingProgress.userId, userId),
          eq(onboardingProgress.stepId, stepId)
        )
      )
  } else {
    await db.insert(onboardingProgress).values({
      userId,
      stepId,
      completed,
      completedAt: completed ? new Date() : null,
    })
  }

  return { success: true }
}

export async function getOnboardingProgress() {
  const userId = await getUserId()

  const progress = await db
    .select()
    .from(onboardingProgress)
    .where(eq(onboardingProgress.userId, userId))

  return progress
}

export async function createWorkflowRun(
  workflowName: string,
  metadata?: Record<string, unknown>
) {
  const userId = await getUserId()
  const workflowRunId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  await db.insert(workflowRun).values({
    id: workflowRunId,
    userId,
    workflowName,
    status: 'running',
    startedAt: new Date(),
    metadata: JSON.stringify(metadata || {}),
  })

  return workflowRunId
}

export async function updateWorkflowRun(
  workflowRunId: string,
  updates: {
    status?: string
    error?: string | null
    completedAt?: Date | null
  }
) {
  const userId = await getUserId()

  await db
    .update(workflowRun)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(workflowRun.id, workflowRunId), eq(workflowRun.userId, userId)))

  return { success: true }
}

export async function logWorkflowStep(
  workflowRunId: string,
  stepName: string,
  status: string,
  duration?: number,
  error?: string
) {
  const userId = await getUserId()

  // Verify the workflow run belongs to this user
  const run = await db
    .select()
    .from(workflowRun)
    .where(
      and(eq(workflowRun.id, workflowRunId), eq(workflowRun.userId, userId))
    )

  if (run.length === 0) {
    throw new Error('Workflow run not found')
  }

  await db.insert(workflowStep).values({
    workflowRunId,
    stepName,
    status,
    startedAt: new Date(),
    completedAt: status === 'completed' || status === 'failed' ? new Date() : null,
    duration: duration?.toString(),
    error,
  })

  return { success: true }
}

export async function getWorkflowRuns(limit = 10) {
  const userId = await getUserId()

  const runs = await db
    .select()
    .from(workflowRun)
    .where(eq(workflowRun.userId, userId))
    .orderBy(desc(workflowRun.createdAt))
    .limit(limit)

  return runs
}

export async function getWorkflowRunDetails(workflowRunId: string) {
  const userId = await getUserId()

  const run = await db
    .select()
    .from(workflowRun)
    .where(and(eq(workflowRun.id, workflowRunId), eq(workflowRun.userId, userId)))

  if (run.length === 0) {
    throw new Error('Workflow run not found')
  }

  const steps = await db
    .select()
    .from(workflowStep)
    .where(eq(workflowStep.workflowRunId, workflowRunId))
    .orderBy(desc(workflowStep.createdAt))

  return {
    run: run[0],
    steps,
  }
}

export async function logEmail(
  email: string,
  type: string,
  subject: string,
  messageId?: string,
  workflowRunId?: string,
  status = 'sent'
) {
  const userId = await getUserId()

  await db.insert(emailLog).values({
    userId,
    email,
    type,
    subject,
    messageId,
    workflowRunId,
    status,
    sentAt: new Date(),
  })

  return { success: true }
}

export async function getEmailLogs(limit = 50) {
  const userId = await getUserId()

  const logs = await db
    .select()
    .from(emailLog)
    .where(eq(emailLog.userId, userId))
    .orderBy(desc(emailLog.createdAt))
    .limit(limit)

  return logs
}
