// Stripe Event Types and CloudEvents Wrapper

export interface CloudEventEnvelope {
  specversion: string
  type: string
  source: string
  id: string
  time: string
  subject: string | null
  dataContentType: string
  data: StripeEvent
}

export interface StripeEvent {
  id: string
  object: string
  type: string
  livemode: boolean
  created: string
  related_object?: {
    id: string
    type: string
    url: string
  }
  data?: Record<string, any>
}

export interface StoredStripeEvent {
  id: string
  userId: string
  eventId: string // Stripe event ID
  eventType: string
  status: 'received' | 'processing' | 'completed' | 'failed'
  data: CloudEventEnvelope
  error?: string
  processedAt?: Date
  retryCount: number
  lastRetryAt?: Date
  nextRetryAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type StripeEventType =
  | 'charge.succeeded'
  | 'charge.failed'
  | 'charge.refunded'
  | 'invoice.created'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'customer.created'
  | 'customer.updated'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.deleted'

export interface EventProcessingResult {
  success: boolean
  eventId: string
  processedAt: Date
  message?: string
  error?: string
}

export interface EventRetryPolicy {
  maxRetries: number
  retryDelayMs: number
  backoffMultiplier: number
  maxBackoffMs: number
}
