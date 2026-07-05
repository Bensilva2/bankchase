import { sendOnboardingEmail, sendWorkflowCompletionEmail, sendCustomEmail } from '@/lib/email/mock-email-service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, email, name, workflowRunId, subject, html, text, cc, bcc, replyTo } = body

    if (!type || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, email' },
        { status: 400 }
      )
    }

    let result

    if (type === 'onboarding') {
      if (!name) {
        return NextResponse.json(
          { success: false, error: 'Name is required for onboarding emails' },
          { status: 400 }
        )
      }
      result = await sendOnboardingEmail({ email, name })
    } else if (type === 'completion') {
      if (!name || !workflowRunId) {
        return NextResponse.json(
          { success: false, error: 'Name and workflowRunId are required for completion emails' },
          { status: 400 }
        )
      }
      result = await sendWorkflowCompletionEmail({
        email,
        name,
        workflowRunId,
      })
    } else if (type === 'custom') {
      if (!subject) {
        return NextResponse.json(
          { success: false, error: 'Subject is required for custom emails' },
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
