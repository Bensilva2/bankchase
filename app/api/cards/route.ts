import { NextRequest, NextResponse } from 'next/server'
import {
  issueCard,
  getCard,
  getUserCards,
  activateCard,
  setCardFrozen,
  cancelCard,
  updateSpendingControls,
  setCardPin,
  authorizeTransaction,
  getCardTransactions,
  replaceCard,
  getCardStats,
  type CardType,
  type CardDesign,
  type CardBrand
} from '@/lib/card-issuing-service'

// POST - Card operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'issue': {
        const {
          userId,
          accountId,
          type,
          brand,
          design,
          cardholderName,
          pin,
          billingAddress,
          customControls
        } = data as {
          userId: string
          accountId: string
          type: CardType
          brand?: CardBrand
          design?: CardDesign
          cardholderName: string
          pin?: string
          billingAddress?: {
            street: string
            city: string
            state: string
            postalCode: string
            country: string
          }
          customControls?: Record<string, unknown>
        }

        if (!userId || !accountId || !type || !cardholderName) {
          return NextResponse.json(
            { error: 'userId, accountId, type, and cardholderName required' },
            { status: 400 }
          )
        }

        const result = issueCard(userId, accountId, {
          type,
          brand,
          design,
          cardholderName,
          pin,
          billingAddress,
          customControls
        })

        return NextResponse.json({
          success: true,
          card: result.card,
          cardDetails: result.cardDetails // Only shown once!
        })
      }

      case 'activate': {
        const { cardId, lastFourDigits } = data
        if (!cardId || !lastFourDigits) {
          return NextResponse.json(
            { error: 'cardId and lastFourDigits required' },
            { status: 400 }
          )
        }

        const success = activateCard(cardId, lastFourDigits)
        if (!success) {
          return NextResponse.json(
            { error: 'Activation failed - invalid card or digits' },
            { status: 400 }
          )
        }

        return NextResponse.json({ success: true })
      }

      case 'freeze': {
        const { cardId, frozen } = data
        if (!cardId || frozen === undefined) {
          return NextResponse.json(
            { error: 'cardId and frozen status required' },
            { status: 400 }
          )
        }

        const success = setCardFrozen(cardId, frozen)
        if (!success) {
          return NextResponse.json(
            { error: 'Operation failed' },
            { status: 400 }
          )
        }

        return NextResponse.json({ success: true })
      }

      case 'cancel': {
        const { cardId } = data
        if (!cardId) {
          return NextResponse.json(
            { error: 'cardId required' },
            { status: 400 }
          )
        }

        const success = cancelCard(cardId)
        if (!success) {
          return NextResponse.json(
            { error: 'Card not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({ success: true })
      }

      case 'update_controls': {
        const { cardId, controls } = data
        if (!cardId || !controls) {
          return NextResponse.json(
            { error: 'cardId and controls required' },
            { status: 400 }
          )
        }

        const success = updateSpendingControls(cardId, controls)
        if (!success) {
          return NextResponse.json(
            { error: 'Card not found' },
            { status: 404 }
          )
        }

        const card = getCard(cardId)
        return NextResponse.json({ success: true, card })
      }

      case 'set_pin': {
        const { cardId, pin } = data
        if (!cardId || !pin) {
          return NextResponse.json(
            { error: 'cardId and pin required' },
            { status: 400 }
          )
        }

        const success = setCardPin(cardId, pin)
        if (!success) {
          return NextResponse.json(
            { error: 'Invalid PIN format (4 digits required)' },
            { status: 400 }
          )
        }

        return NextResponse.json({ success: true })
      }

      case 'authorize': {
        const { cardId, amount, merchantName, mcc, location } = data
        if (!cardId || !amount || !merchantName || !mcc) {
          return NextResponse.json(
            { error: 'cardId, amount, merchantName, and mcc required' },
            { status: 400 }
          )
        }

        const result = authorizeTransaction(cardId, amount, merchantName, mcc, location)
        return NextResponse.json(result)
      }

      case 'replace': {
        const { cardId, reason } = data
        if (!cardId || !reason) {
          return NextResponse.json(
            { error: 'cardId and reason required' },
            { status: 400 }
          )
        }

        const newCard = replaceCard(cardId, reason)
        if (!newCard) {
          return NextResponse.json(
            { error: 'Card not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({ success: true, card: newCard })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Cards API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get card(s) or transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get('cardId')
    const userId = searchParams.get('userId')
    const transactions = searchParams.get('transactions')
    const stats = searchParams.get('stats')

    if (stats === 'true') {
      const cardStats = getCardStats()
      return NextResponse.json({ success: true, stats: cardStats })
    }

    if (cardId && transactions === 'true') {
      const txns = getCardTransactions(cardId)
      return NextResponse.json({ success: true, transactions: txns })
    }

    if (cardId) {
      const card = getCard(cardId)
      if (!card) {
        return NextResponse.json(
          { error: 'Card not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, card })
    }

    if (userId) {
      const cards = getUserCards(userId)
      return NextResponse.json({ success: true, cards })
    }

    return NextResponse.json(
      { error: 'cardId or userId required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Cards API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
