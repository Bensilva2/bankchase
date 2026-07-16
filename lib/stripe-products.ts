export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  type: 'transfer' | 'subscription' | 'bill-pay'
}

// Banking service products - source of truth for pricing
export const PRODUCTS: Product[] = [
  {
    id: 'instant-transfer',
    name: 'Instant Transfer',
    description: 'Instant money transfer using FedNow or RTP',
    priceInCents: 50, // $0.50
    type: 'transfer',
  },
  {
    id: 'international-transfer',
    name: 'International Transfer',
    description: 'SWIFT transfer to international accounts',
    priceInCents: 2500, // $25.00
    type: 'transfer',
  },
  {
    id: 'premium-subscription',
    name: 'Premium Banking',
    description: 'Unlimited transfers, priority support',
    priceInCents: 999, // $9.99/month
    type: 'subscription',
  },
  {
    id: 'bill-pay-pack',
    name: 'Bill Pay Pack',
    description: 'Pay 10 bills with automated reminders',
    priceInCents: 1999, // $19.99
    type: 'bill-pay',
  },
]

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

export function validateProductPrice(productId: string, amount: number): boolean {
  const product = getProduct(productId)
  return product ? product.priceInCents === amount : false
}
