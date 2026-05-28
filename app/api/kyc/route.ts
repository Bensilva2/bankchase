import { NextRequest, NextResponse } from 'next/server'
import {
  initializeKYCProfile,
  getKYCProfile,
  uploadDocument,
  verifyDocument,
  calculateRiskScore,
  screenTransaction,
  getKYCStats,
  type DocumentType
} from '@/lib/kyc-service'

// POST - Initialize or update KYC profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, ...data } = body

    switch (action) {
      case 'initialize': {
        const { personalInfo } = data
        if (!userId || !personalInfo) {
          return NextResponse.json(
            { error: 'userId and personalInfo required' },
            { status: 400 }
          )
        }
        const profile = initializeKYCProfile(userId, personalInfo)
        return NextResponse.json({ success: true, profile })
      }

      case 'upload_document': {
        const { documentType, fileName } = data as { documentType: DocumentType; fileName: string }
        if (!userId || !documentType || !fileName) {
          return NextResponse.json(
            { error: 'userId, documentType, and fileName required' },
            { status: 400 }
          )
        }
        const document = uploadDocument(userId, documentType, fileName)
        if (!document) {
          return NextResponse.json(
            { error: 'KYC profile not found' },
            { status: 404 }
          )
        }
        return NextResponse.json({ success: true, document })
      }

      case 'verify_document': {
        const { documentId, approved, rejectionReason } = data
        if (!userId || !documentId || approved === undefined) {
          return NextResponse.json(
            { error: 'userId, documentId, and approved status required' },
            { status: 400 }
          )
        }
        const success = verifyDocument(userId, documentId, approved, rejectionReason)
        if (!success) {
          return NextResponse.json(
            { error: 'Document not found' },
            { status: 404 }
          )
        }
        const profile = getKYCProfile(userId)
        return NextResponse.json({ success: true, profile })
      }

      case 'calculate_risk': {
        if (!userId) {
          return NextResponse.json(
            { error: 'userId required' },
            { status: 400 }
          )
        }
        const riskScore = calculateRiskScore(userId)
        const profile = getKYCProfile(userId)
        return NextResponse.json({
          success: true,
          riskScore,
          riskLevel: profile?.riskLevel
        })
      }

      case 'screen_transaction': {
        const { amount, type, recipientCountry } = data
        if (!userId || !amount || !type) {
          return NextResponse.json(
            { error: 'userId, amount, and type required' },
            { status: 400 }
          )
        }
        const result = screenTransaction(userId, amount, type, recipientCountry)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('KYC API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get KYC profile or stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const stats = searchParams.get('stats')

    if (stats === 'true') {
      const kycStats = getKYCStats()
      return NextResponse.json({ success: true, stats: kycStats })
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      )
    }

    const profile = getKYCProfile(userId)
    if (!profile) {
      return NextResponse.json(
        { error: 'KYC profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('KYC API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
