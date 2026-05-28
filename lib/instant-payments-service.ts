// Instant Payments Service - Supporting FedNow, SEPA Instant, UPI-style transfers
// Based on McKinsey Global Payments Report insights on instant payments growth

export interface InstantPaymentRequest {
  senderId: string
  recipientId: string
  amount: number
  currency: string
  paymentRail: 'fednow' | 'sepa_instant' | 'rtp' | 'ach_same_day' | 'zelle'
  memo?: string
  metadata?: Record<string, unknown>
}

export interface InstantPaymentResponse {
  transactionId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  estimatedCompletion: string
  fees: number
  exchangeRate?: number
  trackingUrl?: string
  confirmationCode: string
}

export interface PaymentRailInfo {
  id: string
  name: string
  description: string
  maxAmount: number
  processingTime: string
  fees: { fixed: number; percentage: number }
  availability: string
  countries: string[]
}

// Available payment rails with their characteristics
export const PAYMENT_RAILS: PaymentRailInfo[] = [
  {
    id: 'fednow',
    name: 'FedNow',
    description: 'Federal Reserve instant payment service',
    maxAmount: 500000,
    processingTime: 'Instant (seconds)',
    fees: { fixed: 0, percentage: 0 },
    availability: '24/7/365',
    countries: ['US'],
  },
  {
    id: 'rtp',
    name: 'RTP (Real-Time Payments)',
    description: 'The Clearing House real-time payment network',
    maxAmount: 1000000,
    processingTime: 'Instant (seconds)',
    fees: { fixed: 0.25, percentage: 0 },
    availability: '24/7/365',
    countries: ['US'],
  },
  {
    id: 'sepa_instant',
    name: 'SEPA Instant',
    description: 'Single Euro Payments Area instant credit transfer',
    maxAmount: 100000,
    processingTime: 'Up to 10 seconds',
    fees: { fixed: 0.20, percentage: 0 },
    availability: '24/7/365',
    countries: ['EU', 'UK', 'CH', 'NO'],
  },
  {
    id: 'ach_same_day',
    name: 'ACH Same Day',
    description: 'Same-day ACH transfers',
    maxAmount: 1000000,
    processingTime: '1-4 hours',
    fees: { fixed: 0, percentage: 0 },
    availability: 'Business days',
    countries: ['US'],
  },
  {
    id: 'zelle',
    name: 'Zelle',
    description: 'P2P instant payment network',
    maxAmount: 5000,
    processingTime: 'Minutes',
    fees: { fixed: 0, percentage: 0 },
    availability: '24/7',
    countries: ['US'],
  },
]

// Simulated instant payment processing
export async function processInstantPayment(
  request: InstantPaymentRequest
): Promise<InstantPaymentResponse> {
  const rail = PAYMENT_RAILS.find((r) => r.id === request.paymentRail)
  if (!rail) {
    throw new Error(`Unsupported payment rail: ${request.paymentRail}`)
  }

  // Validate amount against rail limits
  if (request.amount > rail.maxAmount) {
    throw new Error(`Amount exceeds ${rail.name} limit of $${rail.maxAmount.toLocaleString()}`)
  }

  // Calculate fees
  const fees = rail.fees.fixed + (request.amount * rail.fees.percentage) / 100

  // Generate transaction ID and confirmation
  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  const confirmationCode = Math.random().toString(36).substr(2, 8).toUpperCase()

  // Simulate processing delay based on rail
  const processingDelay = getProcessingDelay(request.paymentRail)
  
  return {
    transactionId,
    status: processingDelay === 0 ? 'completed' : 'processing',
    estimatedCompletion: rail.processingTime,
    fees,
    confirmationCode,
    trackingUrl: `/transactions/${transactionId}`,
  }
}

function getProcessingDelay(rail: string): number {
  switch (rail) {
    case 'fednow':
    case 'rtp':
      return 0 // Instant
    case 'sepa_instant':
      return 10000 // 10 seconds
    case 'zelle':
      return 60000 // 1 minute
    case 'ach_same_day':
      return 3600000 // 1 hour
    default:
      return 86400000 // 24 hours
  }
}

// Real-time transaction tracking
export interface TransactionStatus {
  transactionId: string
  status: 'initiated' | 'validating' | 'processing' | 'clearing' | 'settled' | 'completed' | 'failed'
  statusMessage: string
  timestamp: Date
  steps: TransactionStep[]
  estimatedCompletion?: Date
}

export interface TransactionStep {
  step: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  timestamp?: Date
  details?: string
}

export function generateTransactionSteps(paymentRail: string): TransactionStep[] {
  const baseSteps: TransactionStep[] = [
    { step: 'Payment Initiated', status: 'completed', timestamp: new Date() },
    { step: 'Account Verification', status: 'completed', timestamp: new Date() },
    { step: 'Compliance Check', status: 'completed', timestamp: new Date() },
    { step: 'Funds Reserved', status: 'in_progress' },
    { step: 'Network Processing', status: 'pending' },
    { step: 'Recipient Bank Confirmation', status: 'pending' },
    { step: 'Settlement Complete', status: 'pending' },
  ]

  // Add rail-specific steps
  if (paymentRail === 'sepa_instant' || paymentRail.includes('international')) {
    baseSteps.splice(3, 0, {
      step: 'FX Conversion',
      status: 'pending',
      details: 'Currency exchange processing',
    })
  }

  return baseSteps
}

// Multi-currency wallet support
export interface CurrencyWallet {
  currency: string
  balance: number
  availableBalance: number
  pendingTransactions: number
  lastUpdated: Date
}

export interface ExchangeRate {
  fromCurrency: string
  toCurrency: string
  rate: number
  timestamp: Date
  provider: string
  validUntil: Date
}

// Simulated exchange rates (in production, these would come from a live feed)
export function getExchangeRate(from: string, to: string): ExchangeRate {
  const rates: Record<string, Record<string, number>> = {
    USD: { EUR: 0.92, GBP: 0.79, JPY: 149.50, CAD: 1.36, MXN: 17.15, INR: 83.12, CNY: 7.24 },
    EUR: { USD: 1.09, GBP: 0.86, JPY: 162.50, CAD: 1.48, MXN: 18.65, INR: 90.45, CNY: 7.88 },
    GBP: { USD: 1.27, EUR: 1.16, JPY: 189.20, CAD: 1.72, MXN: 21.70, INR: 105.30, CNY: 9.17 },
  }

  const rate = rates[from]?.[to] || 1

  return {
    fromCurrency: from,
    toCurrency: to,
    rate,
    timestamp: new Date(),
    provider: 'Chase FX Services',
    validUntil: new Date(Date.now() + 30000), // Valid for 30 seconds
  }
}

export function convertCurrency(amount: number, from: string, to: string): { converted: number; rate: ExchangeRate } {
  const rate = getExchangeRate(from, to)
  return {
    converted: amount * rate.rate,
    rate,
  }
}

// Transaction limits and compliance
export interface TransactionLimits {
  dailyLimit: number
  weeklyLimit: number
  monthlyLimit: number
  perTransactionLimit: number
  remainingDaily: number
  remainingWeekly: number
  remainingMonthly: number
}

export function getTransactionLimits(accountType: string): TransactionLimits {
  const limits: Record<string, Omit<TransactionLimits, 'remainingDaily' | 'remainingWeekly' | 'remainingMonthly'>> = {
    checking: {
      dailyLimit: 10000,
      weeklyLimit: 25000,
      monthlyLimit: 50000,
      perTransactionLimit: 5000,
    },
    savings: {
      dailyLimit: 5000,
      weeklyLimit: 15000,
      monthlyLimit: 30000,
      perTransactionLimit: 3000,
    },
    premium: {
      dailyLimit: 50000,
      weeklyLimit: 150000,
      monthlyLimit: 500000,
      perTransactionLimit: 25000,
    },
    business: {
      dailyLimit: 100000,
      weeklyLimit: 500000,
      monthlyLimit: 2000000,
      perTransactionLimit: 100000,
    },
  }

  const baseLimits = limits[accountType] || limits.checking

  // In production, these would be calculated from actual transaction history
  return {
    ...baseLimits,
    remainingDaily: baseLimits.dailyLimit * 0.85,
    remainingWeekly: baseLimits.weeklyLimit * 0.72,
    remainingMonthly: baseLimits.monthlyLimit * 0.45,
  }
}
