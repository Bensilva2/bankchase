/**
 * Modular Payment Gateway Framework
 * Pluggable architecture for multiple payment providers
 */

import { audit } from './audit-service'
import crypto from 'crypto'

// Payment method types
export type PaymentMethod = 
  | 'card'
  | 'bank_transfer'
  | 'wallet'
  | 'bnpl' // Buy Now Pay Later
  | 'crypto'

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'authorized'
  | 'captured'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'

export type GatewayProvider = 
  | 'stripe'
  | 'adyen'
  | 'braintree'
  | 'square'
  | 'paypal'
  | 'internal'

// Payment request interface
export interface PaymentRequest {
  amount: number
  currency: string
  method: PaymentMethod
  customerId: string
  description?: string
  metadata?: Record<string, string>
  tokenizedCard?: string // For card payments
  bankAccount?: {
    routingNumber: string
    accountNumber: string
    accountType: 'checking' | 'savings'
  }
  billingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  returnUrl?: string // For redirects
  webhookUrl?: string
}

// Payment response interface
export interface PaymentResponse {
  id: string
  status: PaymentStatus
  amount: number
  currency: string
  provider: GatewayProvider
  providerTransactionId?: string
  authorizationCode?: string
  errorCode?: string
  errorMessage?: string
  metadata?: Record<string, string>
  createdAt: Date
  updatedAt: Date
  capturedAt?: Date
  refundedAmount?: number
}

// Gateway interface - all providers implement this
export interface PaymentGateway {
  name: GatewayProvider
  supportedMethods: PaymentMethod[]
  supportedCurrencies: string[]
  
  authorize(request: PaymentRequest): Promise<PaymentResponse>
  capture(paymentId: string, amount?: number): Promise<PaymentResponse>
  refund(paymentId: string, amount?: number, reason?: string): Promise<PaymentResponse>
  void(paymentId: string): Promise<PaymentResponse>
  getStatus(paymentId: string): Promise<PaymentResponse>
}

// In-memory payment storage
const payments: Map<string, PaymentResponse> = new Map()

/**
 * Generate payment ID
 */
function generatePaymentId(): string {
  return `pay_${crypto.randomBytes(16).toString('hex')}`
}

/**
 * Internal Payment Gateway (for simulation)
 */
class InternalGateway implements PaymentGateway {
  name: GatewayProvider = 'internal'
  supportedMethods: PaymentMethod[] = ['card', 'bank_transfer', 'wallet']
  supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']

  async authorize(request: PaymentRequest): Promise<PaymentResponse> {
    const paymentId = generatePaymentId()
    
    // Simulate authorization
    const success = Math.random() > 0.05 // 95% success rate
    
    const payment: PaymentResponse = {
      id: paymentId,
      status: success ? 'authorized' : 'failed',
      amount: request.amount,
      currency: request.currency,
      provider: this.name,
      providerTransactionId: `int_${crypto.randomBytes(8).toString('hex')}`,
      authorizationCode: success ? crypto.randomBytes(4).toString('hex').toUpperCase() : undefined,
      errorCode: success ? undefined : 'DECLINED',
      errorMessage: success ? undefined : 'Transaction declined by issuer',
      metadata: request.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    payments.set(paymentId, payment)
    
    audit.transaction(
      request.customerId,
      'payment_authorization',
      request.amount,
      success,
      { paymentId, provider: this.name }
    )
    
    return payment
  }

  async capture(paymentId: string, amount?: number): Promise<PaymentResponse> {
    const payment = payments.get(paymentId)
    if (!payment) {
      throw new Error('Payment not found')
    }
    
    if (payment.status !== 'authorized') {
      throw new Error(`Cannot capture payment in ${payment.status} status`)
    }
    
    const captureAmount = amount || payment.amount
    
    payment.status = 'captured'
    payment.capturedAt = new Date()
    payment.updatedAt = new Date()
    
    if (captureAmount < payment.amount) {
      payment.amount = captureAmount
    }
    
    return payment
  }

  async refund(paymentId: string, amount?: number, reason?: string): Promise<PaymentResponse> {
    const payment = payments.get(paymentId)
    if (!payment) {
      throw new Error('Payment not found')
    }
    
    if (!['captured', 'completed'].includes(payment.status)) {
      throw new Error(`Cannot refund payment in ${payment.status} status`)
    }
    
    const refundAmount = amount || payment.amount
    const previousRefund = payment.refundedAmount || 0
    
    if (refundAmount + previousRefund > payment.amount) {
      throw new Error('Refund amount exceeds captured amount')
    }
    
    payment.refundedAmount = previousRefund + refundAmount
    payment.status = payment.refundedAmount >= payment.amount ? 'refunded' : 'partially_refunded'
    payment.updatedAt = new Date()
    payment.metadata = { ...payment.metadata, refundReason: reason || 'Customer request' }
    
    return payment
  }

  async void(paymentId: string): Promise<PaymentResponse> {
    const payment = payments.get(paymentId)
    if (!payment) {
      throw new Error('Payment not found')
    }
    
    if (payment.status !== 'authorized') {
      throw new Error(`Cannot void payment in ${payment.status} status`)
    }
    
    payment.status = 'cancelled'
    payment.updatedAt = new Date()
    
    return payment
  }

  async getStatus(paymentId: string): Promise<PaymentResponse> {
    const payment = payments.get(paymentId)
    if (!payment) {
      throw new Error('Payment not found')
    }
    return payment
  }
}

/**
 * Stripe Gateway (simulated)
 */
class StripeGateway implements PaymentGateway {
  name: GatewayProvider = 'stripe'
  supportedMethods: PaymentMethod[] = ['card', 'bank_transfer', 'wallet', 'bnpl']
  supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF']

  async authorize(request: PaymentRequest): Promise<PaymentResponse> {
    const paymentId = generatePaymentId()
    
    // Simulate Stripe API call
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const success = Math.random() > 0.03 // 97% success rate
    
    const payment: PaymentResponse = {
      id: paymentId,
      status: success ? 'authorized' : 'failed',
      amount: request.amount,
      currency: request.currency,
      provider: this.name,
      providerTransactionId: `pi_${crypto.randomBytes(12).toString('hex')}`,
      authorizationCode: success ? crypto.randomBytes(4).toString('hex').toUpperCase() : undefined,
      errorCode: success ? undefined : 'card_declined',
      errorMessage: success ? undefined : 'Your card was declined',
      metadata: request.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    payments.set(paymentId, payment)
    
    audit.transaction(
      request.customerId,
      'payment_authorization',
      request.amount,
      success,
      { paymentId, provider: this.name }
    )
    
    return payment
  }

  async capture(paymentId: string, amount?: number): Promise<PaymentResponse> {
    const payment = payments.get(paymentId)
    if (!payment) throw new Error('Payment not found')
    
    if (payment.status !== 'authorized') {
      throw new Error(`Cannot capture payment in ${payment.status} status`)
    }
    
    payment.status = 'captured'
    payment.capturedAt = new Date()
    payment.updatedAt = new Date()
    if (amount && amount < payment.amount) {
      payment.amount = amount
    }
    
    return payment
  }

  async refund(paymentId: string, amount?: number, reason?: string): Promise<PaymentResponse> {
    const payment = payments.get(paymentId)
    if (!payment) throw new Error('Payment not found')
    
    const refundAmount = amount || payment.amount
    payment.refundedAmount = (payment.refundedAmount || 0) + refundAmount
    payment.status = payment.refundedAmount >= payment.amount ? 'refunded' : 'partially_refunded'
    payment.updatedAt = new Date()
    
    return payment
  }

  async void(paymentId: string): Promise<PaymentResponse> {
    const payment = payments.get(paymentId)
    if (!payment) throw new Error('Payment not found')
    
    payment.status = 'cancelled'
    payment.updatedAt = new Date()
    
    return payment
  }

  async getStatus(paymentId: string): Promise<PaymentResponse> {
    const payment = payments.get(paymentId)
    if (!payment) throw new Error('Payment not found')
    return payment
  }
}

/**
 * Adyen Gateway (simulated)
 */
class AdyenGateway implements PaymentGateway {
  name: GatewayProvider = 'adyen'
  supportedMethods: PaymentMethod[] = ['card', 'bank_transfer', 'wallet', 'bnpl']
  supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK']

  async authorize(request: PaymentRequest): Promise<PaymentResponse> {
    const paymentId = generatePaymentId()
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const success = Math.random() > 0.04
    
    const payment: PaymentResponse = {
      id: paymentId,
      status: success ? 'authorized' : 'failed',
      amount: request.amount,
      currency: request.currency,
      provider: this.name,
      providerTransactionId: `${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
      authorizationCode: success ? crypto.randomBytes(3).toString('hex').toUpperCase() : undefined,
      errorCode: success ? undefined : 'Refused',
      errorMessage: success ? undefined : 'Transaction refused',
      metadata: request.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    payments.set(paymentId, payment)
    
    audit.transaction(
      request.customerId,
      'payment_authorization',
      request.amount,
      success,
      { paymentId, provider: this.name }
    )
    
    return payment
  }

  async capture(paymentId: string, amount?: number): Promise<PaymentResponse> {
    const payment = payments.get(paymentId)
    if (!payment) throw new Error('Payment not found')
    
    payment.status = 'captured'
    payment.capturedAt = new Date()
    payment.updatedAt = new Date()
    if (amount) payment.amount = amount
    
    return payment
  }

  async refund(paymentId: string, amount?: number): Promise<PaymentResponse> {
    const payment = payments.get(paymentId)
    if (!payment) throw new Error('Payment not found')
    
    const refundAmount = amount || payment.amount
    payment.refundedAmount = (payment.refundedAmount || 0) + refundAmount
    payment.status = payment.refundedAmount >= payment.amount ? 'refunded' : 'partially_refunded'
    payment.updatedAt = new Date()
    
    return payment
  }

  async void(paymentId: string): Promise<PaymentResponse> {
    const payment = payments.get(paymentId)
    if (!payment) throw new Error('Payment not found')
    payment.status = 'cancelled'
    payment.updatedAt = new Date()
    return payment
  }

  async getStatus(paymentId: string): Promise<PaymentResponse> {
    const payment = payments.get(paymentId)
    if (!payment) throw new Error('Payment not found')
    return payment
  }
}

// Gateway registry
const gateways: Map<GatewayProvider, PaymentGateway> = new Map([
  ['internal', new InternalGateway()],
  ['stripe', new StripeGateway()],
  ['adyen', new AdyenGateway()]
])

/**
 * Get gateway by provider
 */
export function getGateway(provider: GatewayProvider): PaymentGateway {
  const gateway = gateways.get(provider)
  if (!gateway) {
    throw new Error(`Gateway ${provider} not configured`)
  }
  return gateway
}

/**
 * Select best gateway for a payment
 */
export function selectGateway(
  method: PaymentMethod,
  currency: string,
  preferredProvider?: GatewayProvider
): PaymentGateway {
  if (preferredProvider) {
    const preferred = gateways.get(preferredProvider)
    if (preferred &&
        preferred.supportedMethods.includes(method) &&
        preferred.supportedCurrencies.includes(currency)) {
      return preferred
    }
  }
  
  // Find best available gateway
  for (const gateway of gateways.values()) {
    if (gateway.supportedMethods.includes(method) &&
        gateway.supportedCurrencies.includes(currency)) {
      return gateway
    }
  }
  
  throw new Error(`No gateway available for ${method} in ${currency}`)
}

/**
 * Process a payment (authorize + capture)
 */
export async function processPayment(
  request: PaymentRequest,
  preferredProvider?: GatewayProvider
): Promise<PaymentResponse> {
  const gateway = selectGateway(request.method, request.currency, preferredProvider)
  
  // Authorize
  const authResult = await gateway.authorize(request)
  
  if (authResult.status !== 'authorized') {
    return authResult
  }
  
  // Auto-capture
  const captureResult = await gateway.capture(authResult.id)
  
  return captureResult
}

/**
 * Authorize only (for pre-auth flows)
 */
export async function authorizePayment(
  request: PaymentRequest,
  preferredProvider?: GatewayProvider
): Promise<PaymentResponse> {
  const gateway = selectGateway(request.method, request.currency, preferredProvider)
  return gateway.authorize(request)
}

/**
 * Capture an authorized payment
 */
export async function capturePayment(
  paymentId: string,
  amount?: number
): Promise<PaymentResponse> {
  const payment = payments.get(paymentId)
  if (!payment) throw new Error('Payment not found')
  
  const gateway = getGateway(payment.provider)
  return gateway.capture(paymentId, amount)
}

/**
 * Refund a payment
 */
export async function refundPayment(
  paymentId: string,
  amount?: number,
  reason?: string
): Promise<PaymentResponse> {
  const payment = payments.get(paymentId)
  if (!payment) throw new Error('Payment not found')
  
  const gateway = getGateway(payment.provider)
  return gateway.refund(paymentId, amount, reason)
}

/**
 * Void an authorization
 */
export async function voidPayment(paymentId: string): Promise<PaymentResponse> {
  const payment = payments.get(paymentId)
  if (!payment) throw new Error('Payment not found')
  
  const gateway = getGateway(payment.provider)
  return gateway.void(paymentId)
}

/**
 * Get payment status
 */
export async function getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
  const payment = payments.get(paymentId)
  if (!payment) throw new Error('Payment not found')
  
  const gateway = getGateway(payment.provider)
  return gateway.getStatus(paymentId)
}

/**
 * Get payment statistics
 */
export function getPaymentStats(): {
  totalPayments: number
  byStatus: Record<string, number>
  byProvider: Record<string, number>
  totalVolume: number
  successRate: number
} {
  const allPayments = Array.from(payments.values())
  
  const byStatus: Record<string, number> = {}
  const byProvider: Record<string, number> = {}
  let successCount = 0
  let totalVolume = 0
  
  for (const p of allPayments) {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1
    byProvider[p.provider] = (byProvider[p.provider] || 0) + 1
    
    if (['captured', 'completed'].includes(p.status)) {
      successCount++
      totalVolume += p.amount
    }
  }
  
  return {
    totalPayments: allPayments.length,
    byStatus,
    byProvider,
    totalVolume,
    successRate: allPayments.length > 0 ? (successCount / allPayments.length) * 100 : 0
  }
}

/**
 * List available gateways
 */
export function listGateways(): Array<{
  name: GatewayProvider
  methods: PaymentMethod[]
  currencies: string[]
}> {
  return Array.from(gateways.values()).map(g => ({
    name: g.name,
    methods: g.supportedMethods,
    currencies: g.supportedCurrencies
  }))
}
