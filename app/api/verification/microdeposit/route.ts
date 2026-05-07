import { NextRequest, NextResponse } from 'next/server'
import { VerificationService } from '@/lib/verification-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sessionId, action } = body

    if (action === 'generate') {
      const deposit = await VerificationService.generateMicrodeposits(userId, sessionId)
      return NextResponse.json(deposit, { status: 201 })
    }

    if (action === 'confirm') {
      const { depositId, amount1, amount2 } = body
      const result = await VerificationService.confirmMicrodeposits(
        depositId,
        parseFloat(amount1),
        parseFloat(amount2)
      )
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Microdeposit error:', error)
    return NextResponse.json(
      { error: 'Failed to process microdeposit' },
      { status: 500 }
    )
  }
}
