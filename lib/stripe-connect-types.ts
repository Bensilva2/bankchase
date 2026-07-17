// Stripe Connect Platform Types

export interface ConnectedAccount {
  id: string
  stripeAccountId: string
  userId: string
  email: string
  businessName: string
  accountStatus: 'pending' | 'verified' | 'restricted' | 'rejected'
  verificationStatus: 'pending' | 'verified' | 'unverified'
  bankAccountId?: string
  defaultPayoutMethod?: string
  commissionRate: number // Platform commission percentage (0-100)
  totalEarnings: number
  totalPayouts: number
  createdAt: Date
  updatedAt: Date
}

export interface MarketplaceProduct {
  id: string
  stripeProductId: string
  connectedAccountId: string
  name: string
  description: string
  priceInCents: number
  currency: string
  images: string[]
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

export interface PlatformCharge {
  id: string
  chargeId: string
  connectedAccountId: string
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed'
  customerEmail: string
  description: string
  platformFeeInCents: number
  connectedAccountFeeInCents: number
  createdAt: Date
  updatedAt: Date
}

export interface BankTransfer {
  id: string
  transferId: string
  connectedAccountId: string
  amount: number
  currency: string
  status: 'pending' | 'in_transit' | 'paid' | 'failed'
  bankAccountId: string
  description: string
  createdAt: Date
  updatedAt: Date
}

export interface Payout {
  id: string
  payoutId: string
  connectedAccountId: string
  amount: number
  currency: string
  status: 'pending' | 'in_transit' | 'paid' | 'failed'
  automatedSchedule: boolean
  arrivalDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface Transfer {
  id: string
  transferId: string
  fromAccountId: string
  toAccountId: string
  amount: number
  currency: string
  status: 'pending' | 'in_transit' | 'paid' | 'failed'
  reason: string
  createdAt: Date
  updatedAt: Date
}

export interface WebhookEvent {
  id: string
  eventId: string
  type: string
  connectedAccountId?: string
  status: 'processed' | 'pending' | 'failed'
  payload: Record<string, any>
  createdAt: Date
}
