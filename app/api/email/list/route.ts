import { getAllEmails, getEmailsByRecipient } from '@/lib/email/mock-email-service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const recipient = searchParams.get('recipient')

    let emails

    if (recipient) {
      emails = getEmailsByRecipient(recipient)
    } else {
      emails = getAllEmails()
    }

    return NextResponse.json({
      success: true,
      emails,
      count: emails.length,
    })
  } catch (error) {
    console.error('[Email List API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
