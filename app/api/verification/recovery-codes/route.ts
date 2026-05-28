import { NextRequest, NextResponse } from 'next/server'
import { VerificationService } from '@/lib/verification-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action } = body

    if (action === 'generate') {
      const codes = VerificationService.generateRecoveryCodes(15)
      await VerificationService.saveRecoveryCodes(userId, codes)
      return NextResponse.json({ codes }, { status: 201 })
    }

    if (action === 'verify') {
      const { code } = body
      const isValid = await VerificationService.verifyRecoveryCode(userId, code)

      if (isValid) {
        return NextResponse.json(
          { success: true, message: 'Recovery code verified' },
          { status: 200 }
        )
      } else {
        return NextResponse.json(
          { success: false, message: 'Invalid or already used recovery code' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Recovery codes error:', error)
    return NextResponse.json(
      { error: 'Failed to process recovery codes' },
      { status: 500 }
    )
  }
}
