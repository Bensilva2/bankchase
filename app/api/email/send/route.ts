import { sendOnboardingEmail, sendWorkflowCompletionEmail } from '@/lib/email/resend-client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { type, email, name, workflowRunId } = await request.json()

    if (!type || !email || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, email, name' },
        { status: 400 }
      )
    }

    let result

    if (type === 'onboarding') {
      result = await sendOnboardingEmail({ email, name })
    } else if (type === 'completion' && workflowRunId) {
      result = await sendWorkflowCompletionEmail({
        email,
        name,
        workflowRunId,
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid email type or missing workflowRunId for completion emails' },
        { status: 400 }
      )
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Email API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
