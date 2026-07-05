import { sendOnboardingEmail, sendWorkflowCompletionEmail, sendCustomEmail } from '@/lib/email/agentmail-client'
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
    } else if (type === 'custom') {
      const { subject, html, text, cc, bcc, replyTo } = await request.json()
      
      if (!subject) {
        return NextResponse.json(
          { success: false, error: 'Missing required field: subject' },
          { status: 400 }
        )
      }
      
      result = await sendCustomEmail({
        to: email,
        subject,
        html,
        text,
        cc,
        bcc,
        replyTo,
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid email type. Supported types: onboarding, completion, custom' },
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
