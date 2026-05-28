import { NextRequest, NextResponse } from 'next/server'
import { getExchangeRate, convertCurrency } from '@/lib/instant-payments-service'

// Supported currencies with their details
const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')?.toUpperCase() || 'USD'
  const to = searchParams.get('to')?.toUpperCase()
  const amount = parseFloat(searchParams.get('amount') || '1')

  // If specific conversion requested
  if (to) {
    try {
      const { converted, rate } = convertCurrency(amount, from, to)
      
      const fromCurrency = SUPPORTED_CURRENCIES.find((c) => c.code === from)
      const toCurrency = SUPPORTED_CURRENCIES.find((c) => c.code === to)

      return NextResponse.json({
        success: true,
        conversion: {
          from: {
            currency: from,
            amount,
            ...fromCurrency,
          },
          to: {
            currency: to,
            amount: converted,
            ...toCurrency,
          },
          rate: rate.rate,
          inverseRate: 1 / rate.rate,
          timestamp: rate.timestamp,
          validUntil: rate.validUntil,
          provider: rate.provider,
        },
      })
    } catch (error) {
      return NextResponse.json(
        { error: 'Currency conversion failed' },
        { status: 400 }
      )
    }
  }

  // Return all rates from base currency
  const rates = SUPPORTED_CURRENCIES.filter((c) => c.code !== from).map((currency) => {
    const rate = getExchangeRate(from, currency.code)
    return {
      ...currency,
      rate: rate.rate,
      converted: amount * rate.rate,
    }
  })

  return NextResponse.json({
    success: true,
    baseCurrency: from,
    baseAmount: amount,
    rates,
    timestamp: new Date().toISOString(),
    supportedCurrencies: SUPPORTED_CURRENCIES,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from, to, amount } = body

    if (!from || !to || !amount) {
      return NextResponse.json(
        { error: 'from, to, and amount are required' },
        { status: 400 }
      )
    }

    const { converted, rate } = convertCurrency(amount, from.toUpperCase(), to.toUpperCase())

    // Calculate fees based on amount
    const fxFee = amount >= 10000 ? 0 : amount * 0.001 // 0.1% fee for amounts under $10k
    const finalAmount = converted - (fxFee * rate.rate)

    return NextResponse.json({
      success: true,
      quote: {
        fromAmount: amount,
        fromCurrency: from.toUpperCase(),
        toAmount: converted,
        toCurrency: to.toUpperCase(),
        rate: rate.rate,
        fxFee,
        finalAmount,
        validUntil: rate.validUntil,
        quoteId: `FX-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate FX quote' },
      { status: 500 }
    )
  }
}
