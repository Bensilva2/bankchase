export const cardOptions = {
  cardTypes: [
    { value: 'debit', label: 'Debit Card' },
    { value: 'credit', label: 'Credit Card' },
    { value: 'prepaid', label: 'Prepaid Card' },
    { value: 'business', label: 'Business Card' },
  ],
  cardBrands: [
    { value: 'visa', label: 'Visa' },
    { value: 'mastercard', label: 'Mastercard' },
    { value: 'amex', label: 'American Express' },
    { value: 'discover', label: 'Discover' },
  ],
  cardDesigns: [
    { value: 'classic', label: 'Classic' },
    { value: 'premium', label: 'Premium' },
    { value: 'metal', label: 'Metal' },
    { value: 'custom', label: 'Custom' },
  ],
  cardFeatures: [
    { value: 'contactless', label: 'Contactless Payments' },
    { value: 'international', label: 'International Use' },
    { value: 'online', label: 'Online Shopping' },
    { value: 'atm', label: 'ATM Withdrawals' },
    { value: 'rewards', label: 'Rewards Program' },
    { value: 'cashback', label: 'Cash Back' },
  ],
  spendingLimits: [
    { value: 500, label: '$500' },
    { value: 1000, label: '$1,000' },
    { value: 2500, label: '$2,500' },
    { value: 5000, label: '$5,000' },
    { value: 10000, label: '$10,000' },
    { value: 25000, label: '$25,000' },
  ],
  cardStatuses: [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700' },
    { value: 'locked', label: 'Locked', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'frozen', label: 'Frozen', color: 'bg-red-100 text-red-700' },
    { value: 'expired', label: 'Expired', color: 'bg-gray-100 text-gray-700' },
    { value: 'pending', label: 'Pending', color: 'bg-blue-100 text-blue-700' },
  ],
  rewards: [
    { value: 'cashback', label: 'Cash Back' },
    { value: 'travel', label: 'Travel Points' },
    { value: 'shopping', label: 'Shopping Points' },
    { value: 'dining', label: 'Dining Points' },
  ],
} as const

export function getCardStatusColor(status: string): string {
  const statusOption = cardOptions.cardStatuses.find(s => s.value === status)
  return statusOption?.color || 'bg-gray-100 text-gray-700'
}

export function formatCardNumber(lastFour: string): string {
  return `•••• •••• •••• ${lastFour}`
}

export function getCreditUtilization(balance: number, limit: number): number {
  if (limit === 0) return 0
  return Math.round((balance / limit) * 100)
}

export function getUtilizationColor(utilization: number): string {
  if (utilization >= 80) return 'text-red-600'
  if (utilization >= 50) return 'text-yellow-600'
  return 'text-green-600'
}
