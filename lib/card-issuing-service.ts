/**
 * Card Issuing Service
 * Virtual and physical card management for banking operations
 */

import crypto from 'crypto'
import { tokenizeCard, type CardBrand, type TokenizedCard } from './pci-compliance'
import { audit } from './audit-service'

export type CardType = 'virtual' | 'physical'
export type CardStatus = 'active' | 'frozen' | 'cancelled' | 'expired' | 'pending_activation'
export type CardDesign = 'classic' | 'premium' | 'metal' | 'custom'

export interface SpendingControls {
  dailyLimit: number
  monthlyLimit: number
  singleTransactionLimit: number
  atmWithdrawalLimit: number
  allowInternational: boolean
  allowOnline: boolean
  allowAtm: boolean
  allowContactless: boolean
  merchantCategoryBlocks: string[] // MCC codes to block
  allowedCountries?: string[] // ISO country codes
}

export interface IssuedCard {
  id: string
  userId: string
  accountId: string
  type: CardType
  brand: CardBrand
  token: string // Reference to tokenized card data
  lastFour: string
  cardholderName: string
  expiryMonth: string
  expiryYear: string
  status: CardStatus
  design: CardDesign
  spendingControls: SpendingControls
  pin?: {
    hash: string
    attemptsRemaining: number
    lockedUntil?: Date
  }
  billingAddress?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  metadata: {
    issuedAt: Date
    activatedAt?: Date
    frozenAt?: Date
    cancelledAt?: Date
    lastUsedAt?: Date
    replacementFor?: string
    replacedBy?: string
  }
  notifications: {
    transactionAlerts: boolean
    lowBalanceAlerts: boolean
    securityAlerts: boolean
    marketingOptIn: boolean
  }
  rewards?: {
    programId: string
    pointsBalance: number
    tier: 'basic' | 'preferred' | 'premium'
  }
}

export interface CardTransaction {
  id: string
  cardId: string
  timestamp: Date
  amount: number
  currency: string
  merchantName: string
  merchantCategory: string
  mcc: string
  location?: {
    city?: string
    country: string
  }
  type: 'purchase' | 'refund' | 'atm_withdrawal' | 'fee' | 'reward'
  status: 'pending' | 'approved' | 'declined' | 'reversed'
  declineReason?: string
  authorizationCode?: string
}

// In-memory storage
const issuedCards: Map<string, IssuedCard> = new Map()
const cardTransactions: CardTransaction[] = []

// Default spending controls by card type
const DEFAULT_CONTROLS: Record<CardType, SpendingControls> = {
  virtual: {
    dailyLimit: 2500,
    monthlyLimit: 10000,
    singleTransactionLimit: 1000,
    atmWithdrawalLimit: 0, // Virtual cards can't do ATM
    allowInternational: true,
    allowOnline: true,
    allowAtm: false,
    allowContactless: false,
    merchantCategoryBlocks: []
  },
  physical: {
    dailyLimit: 5000,
    monthlyLimit: 25000,
    singleTransactionLimit: 2500,
    atmWithdrawalLimit: 1000,
    allowInternational: true,
    allowOnline: true,
    allowAtm: true,
    allowContactless: true,
    merchantCategoryBlocks: []
  }
}

/**
 * Generate card number (simulated - follows Luhn algorithm)
 */
function generateCardNumber(brand: CardBrand): string {
  const prefixes: Record<CardBrand, string> = {
    visa: '4',
    mastercard: '51',
    amex: '34',
    discover: '6011',
    unknown: '4'
  }
  
  const prefix = prefixes[brand]
  const length = brand === 'amex' ? 15 : 16
  const randomDigits = length - prefix.length - 1
  
  let number = prefix
  for (let i = 0; i < randomDigits; i++) {
    number += Math.floor(Math.random() * 10).toString()
  }
  
  // Calculate Luhn check digit
  let sum = 0
  let isEven = true
  
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10)
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    isEven = !isEven
  }
  
  const checkDigit = (10 - (sum % 10)) % 10
  return number + checkDigit.toString()
}

/**
 * Generate CVV
 */
function generateCVV(brand: CardBrand): string {
  const length = brand === 'amex' ? 4 : 3
  let cvv = ''
  for (let i = 0; i < length; i++) {
    cvv += Math.floor(Math.random() * 10).toString()
  }
  return cvv
}

/**
 * Generate expiry date (3 years from now)
 */
function generateExpiry(): { month: string; year: string } {
  const now = new Date()
  const expiry = new Date(now.getFullYear() + 3, now.getMonth())
  return {
    month: (expiry.getMonth() + 1).toString().padStart(2, '0'),
    year: expiry.getFullYear().toString().slice(-2)
  }
}

/**
 * Hash PIN for secure storage
 */
function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(pin, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verify PIN
 */
function verifyPin(pin: string, hashedPin: string): boolean {
  const [salt, hash] = hashedPin.split(':')
  const verifyHash = crypto.pbkdf2Sync(pin, salt, 100000, 64, 'sha512').toString('hex')
  return hash === verifyHash
}

/**
 * Issue a new card
 */
export function issueCard(
  userId: string,
  accountId: string,
  options: {
    type: CardType
    brand?: CardBrand
    design?: CardDesign
    cardholderName: string
    pin?: string
    billingAddress?: IssuedCard['billingAddress']
    customControls?: Partial<SpendingControls>
  }
): { card: IssuedCard; cardDetails: { cardNumber: string; cvv: string; expiry: string } } {
  const brand = options.brand || 'visa'
  const cardNumber = generateCardNumber(brand)
  const cvv = generateCVV(brand)
  const expiry = generateExpiry()
  
  // Tokenize the card for secure storage
  const tokenizedCard = tokenizeCard({
    cardNumber,
    expiryMonth: expiry.month,
    expiryYear: expiry.year,
    cvv,
    cardholderName: options.cardholderName
  })
  
  const cardId = `card_${crypto.randomBytes(12).toString('hex')}`
  
  const card: IssuedCard = {
    id: cardId,
    userId,
    accountId,
    type: options.type,
    brand,
    token: tokenizedCard.token,
    lastFour: cardNumber.slice(-4),
    cardholderName: options.cardholderName,
    expiryMonth: expiry.month,
    expiryYear: expiry.year,
    status: options.type === 'virtual' ? 'active' : 'pending_activation',
    design: options.design || 'classic',
    spendingControls: {
      ...DEFAULT_CONTROLS[options.type],
      ...options.customControls
    },
    pin: options.pin ? {
      hash: hashPin(options.pin),
      attemptsRemaining: 3
    } : undefined,
    billingAddress: options.billingAddress,
    metadata: {
      issuedAt: new Date(),
      activatedAt: options.type === 'virtual' ? new Date() : undefined
    },
    notifications: {
      transactionAlerts: true,
      lowBalanceAlerts: true,
      securityAlerts: true,
      marketingOptIn: false
    }
  }
  
  issuedCards.set(cardId, card)
  
  audit.cardTokenized(userId, card.lastFour, brand)
  
  // Return card and sensitive details (shown only once)
  return {
    card,
    cardDetails: {
      cardNumber,
      cvv,
      expiry: `${expiry.month}/${expiry.year}`
    }
  }
}

/**
 * Get card by ID
 */
export function getCard(cardId: string): IssuedCard | null {
  return issuedCards.get(cardId) || null
}

/**
 * Get all cards for a user
 */
export function getUserCards(userId: string): IssuedCard[] {
  return Array.from(issuedCards.values()).filter(c => c.userId === userId)
}

/**
 * Activate a physical card
 */
export function activateCard(cardId: string, lastFourDigits: string): boolean {
  const card = issuedCards.get(cardId)
  if (!card) return false
  
  if (card.lastFour !== lastFourDigits) return false
  if (card.status !== 'pending_activation') return false
  
  card.status = 'active'
  card.metadata.activatedAt = new Date()
  
  return true
}

/**
 * Freeze/unfreeze card
 */
export function setCardFrozen(cardId: string, frozen: boolean): boolean {
  const card = issuedCards.get(cardId)
  if (!card) return false
  
  if (frozen && card.status === 'active') {
    card.status = 'frozen'
    card.metadata.frozenAt = new Date()
    return true
  }
  
  if (!frozen && card.status === 'frozen') {
    card.status = 'active'
    card.metadata.frozenAt = undefined
    return true
  }
  
  return false
}

/**
 * Cancel card
 */
export function cancelCard(cardId: string): boolean {
  const card = issuedCards.get(cardId)
  if (!card) return false
  
  card.status = 'cancelled'
  card.metadata.cancelledAt = new Date()
  
  return true
}

/**
 * Update spending controls
 */
export function updateSpendingControls(
  cardId: string,
  controls: Partial<SpendingControls>
): boolean {
  const card = issuedCards.get(cardId)
  if (!card) return false
  
  card.spendingControls = {
    ...card.spendingControls,
    ...controls
  }
  
  return true
}

/**
 * Set PIN
 */
export function setCardPin(cardId: string, pin: string): boolean {
  const card = issuedCards.get(cardId)
  if (!card) return false
  
  if (!/^\d{4}$/.test(pin)) return false
  
  card.pin = {
    hash: hashPin(pin),
    attemptsRemaining: 3
  }
  
  return true
}

/**
 * Verify PIN (for transactions)
 */
export function verifyCardPin(cardId: string, pin: string): { valid: boolean; locked: boolean } {
  const card = issuedCards.get(cardId)
  if (!card || !card.pin) return { valid: false, locked: false }
  
  // Check if locked
  if (card.pin.lockedUntil && card.pin.lockedUntil > new Date()) {
    return { valid: false, locked: true }
  }
  
  const valid = verifyPin(pin, card.pin.hash)
  
  if (valid) {
    card.pin.attemptsRemaining = 3
    card.pin.lockedUntil = undefined
  } else {
    card.pin.attemptsRemaining--
    if (card.pin.attemptsRemaining <= 0) {
      // Lock for 24 hours
      card.pin.lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  }
  
  return { valid, locked: card.pin.attemptsRemaining <= 0 }
}

/**
 * Authorize a transaction
 */
export function authorizeTransaction(
  cardId: string,
  amount: number,
  merchantName: string,
  mcc: string,
  location?: { city?: string; country: string }
): { authorized: boolean; declineReason?: string; transaction?: CardTransaction } {
  const card = issuedCards.get(cardId)
  if (!card) {
    return { authorized: false, declineReason: 'Card not found' }
  }
  
  // Check card status
  if (card.status !== 'active') {
    return { authorized: false, declineReason: `Card is ${card.status}` }
  }
  
  // Check controls
  const controls = card.spendingControls
  
  if (amount > controls.singleTransactionLimit) {
    return { authorized: false, declineReason: 'Exceeds single transaction limit' }
  }
  
  if (location?.country && controls.allowedCountries && 
      !controls.allowedCountries.includes(location.country)) {
    return { authorized: false, declineReason: 'Transaction in restricted country' }
  }
  
  if (!controls.allowInternational && location?.country && location.country !== 'US') {
    return { authorized: false, declineReason: 'International transactions disabled' }
  }
  
  if (controls.merchantCategoryBlocks.includes(mcc)) {
    return { authorized: false, declineReason: 'Merchant category blocked' }
  }
  
  // Create transaction
  const transaction: CardTransaction = {
    id: `txn_${crypto.randomBytes(12).toString('hex')}`,
    cardId,
    timestamp: new Date(),
    amount,
    currency: 'USD',
    merchantName,
    merchantCategory: getMCCDescription(mcc),
    mcc,
    location,
    type: 'purchase',
    status: 'approved',
    authorizationCode: crypto.randomBytes(4).toString('hex').toUpperCase()
  }
  
  cardTransactions.push(transaction)
  card.metadata.lastUsedAt = new Date()
  
  audit.transaction(card.userId, 'card_purchase', amount, true, {
    cardId,
    merchantName,
    lastFour: card.lastFour
  })
  
  return { authorized: true, transaction }
}

/**
 * Get card transactions
 */
export function getCardTransactions(cardId: string, limit = 50): CardTransaction[] {
  return cardTransactions
    .filter(t => t.cardId === cardId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit)
}

/**
 * Replace lost/stolen card
 */
export function replaceCard(
  cardId: string,
  reason: 'lost' | 'stolen' | 'damaged'
): IssuedCard | null {
  const oldCard = issuedCards.get(cardId)
  if (!oldCard) return null
  
  // Cancel old card
  oldCard.status = 'cancelled'
  oldCard.metadata.cancelledAt = new Date()
  
  // Issue new card with same settings
  const { card: newCard } = issueCard(
    oldCard.userId,
    oldCard.accountId,
    {
      type: oldCard.type,
      brand: oldCard.brand,
      design: oldCard.design,
      cardholderName: oldCard.cardholderName,
      billingAddress: oldCard.billingAddress,
      customControls: oldCard.spendingControls
    }
  )
  
  // Link cards
  oldCard.metadata.replacedBy = newCard.id
  newCard.metadata.replacementFor = oldCard.id
  
  return newCard
}

/**
 * Get MCC description
 */
function getMCCDescription(mcc: string): string {
  const descriptions: Record<string, string> = {
    '5411': 'Grocery Stores',
    '5541': 'Gas Stations',
    '5812': 'Restaurants',
    '5814': 'Fast Food',
    '5912': 'Drug Stores',
    '5311': 'Department Stores',
    '5999': 'Miscellaneous Retail',
    '4111': 'Transportation',
    '7011': 'Hotels',
    '4814': 'Telecommunications',
    '6011': 'ATM Cash Disbursement'
  }
  return descriptions[mcc] || 'Other'
}

/**
 * Get card statistics for admin
 */
export function getCardStats(): {
  totalCards: number
  byType: Record<string, number>
  byStatus: Record<string, number>
  activeCards: number
  totalTransactions: number
  transactionVolume: number
} {
  const cards = Array.from(issuedCards.values())
  
  const byType: Record<string, number> = {}
  const byStatus: Record<string, number> = {}
  
  for (const card of cards) {
    byType[card.type] = (byType[card.type] || 0) + 1
    byStatus[card.status] = (byStatus[card.status] || 0) + 1
  }
  
  return {
    totalCards: cards.length,
    byType,
    byStatus,
    activeCards: cards.filter(c => c.status === 'active').length,
    totalTransactions: cardTransactions.length,
    transactionVolume: cardTransactions
      .filter(t => t.status === 'approved')
      .reduce((sum, t) => sum + t.amount, 0)
  }
}
