/**
 * AML/KYC Compliance Service
 * Anti-Money Laundering and Know Your Customer verification system
 */

import { audit } from './audit-service'
import crypto from 'crypto'

// Verification status types
export type KYCStatus = 
  | 'not_started'
  | 'pending'
  | 'documents_required'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'expired'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type DocumentType = 
  | 'passport'
  | 'drivers_license'
  | 'national_id'
  | 'utility_bill'
  | 'bank_statement'
  | 'tax_return'
  | 'proof_of_address'
  | 'selfie'

export interface KYCDocument {
  id: string
  type: DocumentType
  fileName: string
  uploadedAt: Date
  status: 'pending' | 'verified' | 'rejected'
  rejectionReason?: string
  verifiedAt?: Date
  expiresAt?: Date
}

export interface KYCProfile {
  userId: string
  status: KYCStatus
  riskLevel: RiskLevel
  riskScore: number
  tier: 'basic' | 'standard' | 'enhanced'
  documents: KYCDocument[]
  personalInfo: {
    firstName: string
    lastName: string
    dateOfBirth?: string
    nationality?: string
    taxId?: string
    occupation?: string
    sourceOfFunds?: string
  }
  address?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  verificationHistory: VerificationEvent[]
  limits: TransactionLimits
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date
}

export interface VerificationEvent {
  id: string
  timestamp: Date
  type: 'status_change' | 'document_uploaded' | 'document_verified' | 'risk_assessment' | 'manual_review'
  previousValue?: string
  newValue: string
  performedBy?: string
  notes?: string
}

export interface TransactionLimits {
  dailyLimit: number
  monthlyLimit: number
  singleTransactionLimit: number
  internationalTransferLimit: number
  remainingDaily: number
  remainingMonthly: number
}

export interface AMLAlert {
  id: string
  userId: string
  timestamp: Date
  type: 'suspicious_transaction' | 'structuring' | 'velocity' | 'geographic' | 'pep_match' | 'sanctions_match'
  severity: RiskLevel
  description: string
  transactionId?: string
  amount?: number
  status: 'open' | 'investigating' | 'resolved' | 'escalated' | 'reported'
  assignedTo?: string
  resolution?: string
  resolvedAt?: Date
}

// In-memory storage
const kycProfiles: Map<string, KYCProfile> = new Map()
const amlAlerts: AMLAlert[] = []
const watchlists: Set<string> = new Set()
const pepList: Set<string> = new Set()

// Default limits by tier
const TIER_LIMITS: Record<string, TransactionLimits> = {
  basic: {
    dailyLimit: 500,
    monthlyLimit: 2000,
    singleTransactionLimit: 250,
    internationalTransferLimit: 0,
    remainingDaily: 500,
    remainingMonthly: 2000
  },
  standard: {
    dailyLimit: 5000,
    monthlyLimit: 25000,
    singleTransactionLimit: 2500,
    internationalTransferLimit: 5000,
    remainingDaily: 5000,
    remainingMonthly: 25000
  },
  enhanced: {
    dailyLimit: 50000,
    monthlyLimit: 250000,
    singleTransactionLimit: 25000,
    internationalTransferLimit: 50000,
    remainingDaily: 50000,
    remainingMonthly: 250000
  }
}

/**
 * Generate unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`
}

/**
 * Initialize KYC profile for a user
 */
export function initializeKYCProfile(
  userId: string,
  personalInfo: KYCProfile['personalInfo']
): KYCProfile {
  const profile: KYCProfile = {
    userId,
    status: 'not_started',
    riskLevel: 'low',
    riskScore: 0,
    tier: 'basic',
    documents: [],
    personalInfo,
    verificationHistory: [{
      id: generateId('evt'),
      timestamp: new Date(),
      type: 'status_change',
      newValue: 'Profile created',
      notes: 'KYC verification initiated'
    }],
    limits: { ...TIER_LIMITS.basic },
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  kycProfiles.set(userId, profile)
  audit.kycStarted(userId, personalInfo.firstName + ' ' + personalInfo.lastName)
  
  return profile
}

/**
 * Get KYC profile
 */
export function getKYCProfile(userId: string): KYCProfile | null {
  return kycProfiles.get(userId) || null
}

/**
 * Upload verification document
 */
export function uploadDocument(
  userId: string,
  documentType: DocumentType,
  fileName: string
): KYCDocument | null {
  const profile = kycProfiles.get(userId)
  if (!profile) return null
  
  const document: KYCDocument = {
    id: generateId('doc'),
    type: documentType,
    fileName,
    uploadedAt: new Date(),
    status: 'pending'
  }
  
  profile.documents.push(document)
  profile.status = 'pending'
  profile.updatedAt = new Date()
  
  profile.verificationHistory.push({
    id: generateId('evt'),
    timestamp: new Date(),
    type: 'document_uploaded',
    newValue: `${documentType} uploaded: ${fileName}`
  })
  
  return document
}

/**
 * Verify a document (simulated)
 */
export function verifyDocument(
  userId: string,
  documentId: string,
  approved: boolean,
  rejectionReason?: string
): boolean {
  const profile = kycProfiles.get(userId)
  if (!profile) return false
  
  const document = profile.documents.find(d => d.id === documentId)
  if (!document) return false
  
  document.status = approved ? 'verified' : 'rejected'
  document.verifiedAt = new Date()
  if (!approved && rejectionReason) {
    document.rejectionReason = rejectionReason
  }
  
  profile.verificationHistory.push({
    id: generateId('evt'),
    timestamp: new Date(),
    type: 'document_verified',
    previousValue: 'pending',
    newValue: approved ? 'verified' : 'rejected',
    notes: rejectionReason
  })
  
  // Check if all required documents are verified
  checkAndUpdateKYCStatus(userId)
  
  return true
}

/**
 * Check and update KYC status based on documents
 */
function checkAndUpdateKYCStatus(userId: string): void {
  const profile = kycProfiles.get(userId)
  if (!profile) return
  
  const verifiedDocs = profile.documents.filter(d => d.status === 'verified')
  const hasId = verifiedDocs.some(d => 
    ['passport', 'drivers_license', 'national_id'].includes(d.type)
  )
  const hasAddress = verifiedDocs.some(d => 
    ['utility_bill', 'bank_statement', 'proof_of_address'].includes(d.type)
  )
  const hasSelfie = verifiedDocs.some(d => d.type === 'selfie')
  
  // Update tier based on verified documents
  if (hasId && hasAddress && hasSelfie) {
    profile.tier = 'enhanced'
    profile.status = 'approved'
    profile.limits = { ...TIER_LIMITS.enhanced }
  } else if (hasId && hasAddress) {
    profile.tier = 'standard'
    profile.status = 'approved'
    profile.limits = { ...TIER_LIMITS.standard }
  } else if (hasId) {
    profile.tier = 'basic'
    profile.status = 'approved'
    profile.limits = { ...TIER_LIMITS.basic }
  } else {
    profile.status = 'documents_required'
  }
  
  profile.updatedAt = new Date()
  
  if (profile.status === 'approved') {
    audit.kycCompleted(userId, profile.personalInfo.firstName, profile.tier)
  }
}

/**
 * Calculate risk score for a user
 */
export function calculateRiskScore(userId: string): number {
  const profile = kycProfiles.get(userId)
  if (!profile) return 100
  
  let score = 0
  
  // Document verification status
  const verifiedDocs = profile.documents.filter(d => d.status === 'verified').length
  const totalDocs = profile.documents.length
  score += totalDocs > 0 ? ((totalDocs - verifiedDocs) / totalDocs) * 20 : 20
  
  // Check against watchlists
  const fullName = `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`.toLowerCase()
  if (watchlists.has(fullName) || pepList.has(fullName)) {
    score += 50
  }
  
  // High-risk countries (simplified)
  const highRiskCountries = ['IR', 'KP', 'SY', 'CU']
  if (profile.address?.country && highRiskCountries.includes(profile.address.country)) {
    score += 30
  }
  
  // Source of funds
  if (!profile.personalInfo.sourceOfFunds) {
    score += 10
  }
  
  // Normalize score to 0-100
  score = Math.min(100, Math.max(0, score))
  
  // Update profile
  profile.riskScore = score
  profile.riskLevel = score < 25 ? 'low' : score < 50 ? 'medium' : score < 75 ? 'high' : 'critical'
  profile.updatedAt = new Date()
  
  profile.verificationHistory.push({
    id: generateId('evt'),
    timestamp: new Date(),
    type: 'risk_assessment',
    newValue: `Risk score: ${score} (${profile.riskLevel})`
  })
  
  return score
}

/**
 * Screen transaction for AML
 */
export function screenTransaction(
  userId: string,
  amount: number,
  type: 'domestic' | 'international',
  recipientCountry?: string
): { approved: boolean; alerts: AMLAlert[]; reason?: string } {
  const profile = kycProfiles.get(userId)
  const alerts: AMLAlert[] = []
  
  if (!profile) {
    return { approved: false, alerts, reason: 'KYC profile not found' }
  }
  
  // Check KYC status
  if (profile.status !== 'approved') {
    return { approved: false, alerts, reason: 'KYC verification required' }
  }
  
  // Check transaction limits
  if (amount > profile.limits.singleTransactionLimit) {
    return { approved: false, alerts, reason: `Amount exceeds single transaction limit of $${profile.limits.singleTransactionLimit}` }
  }
  
  if (amount > profile.limits.remainingDaily) {
    return { approved: false, alerts, reason: 'Daily limit exceeded' }
  }
  
  if (type === 'international' && amount > profile.limits.internationalTransferLimit) {
    return { approved: false, alerts, reason: `International transfer limit exceeded ($${profile.limits.internationalTransferLimit})` }
  }
  
  // Structuring detection ($10,000 threshold)
  if (amount >= 9000 && amount < 10000) {
    const alert = createAMLAlert(userId, 'structuring', 'medium',
      `Potential structuring: transaction of $${amount} just below reporting threshold`,
      amount
    )
    alerts.push(alert)
  }
  
  // Large transaction alert
  if (amount >= 10000) {
    const alert = createAMLAlert(userId, 'suspicious_transaction', 'high',
      `Large transaction requiring CTR filing: $${amount}`,
      amount
    )
    alerts.push(alert)
  }
  
  // High-risk country screening
  const highRiskCountries = ['IR', 'KP', 'SY', 'CU', 'VE', 'RU']
  if (recipientCountry && highRiskCountries.includes(recipientCountry)) {
    const alert = createAMLAlert(userId, 'geographic', 'critical',
      `Transaction to high-risk country: ${recipientCountry}`,
      amount
    )
    alerts.push(alert)
    return { approved: false, alerts, reason: 'Transaction to restricted country' }
  }
  
  // Update remaining limits
  profile.limits.remainingDaily -= amount
  profile.limits.remainingMonthly -= amount
  profile.updatedAt = new Date()
  
  return { approved: true, alerts }
}

/**
 * Create AML alert
 */
function createAMLAlert(
  userId: string,
  type: AMLAlert['type'],
  severity: RiskLevel,
  description: string,
  amount?: number
): AMLAlert {
  const alert: AMLAlert = {
    id: generateId('aml'),
    userId,
    timestamp: new Date(),
    type,
    severity,
    description,
    amount,
    status: 'open'
  }
  
  amlAlerts.push(alert)
  
  if (severity === 'critical' || severity === 'high') {
    audit.suspiciousActivity(userId, description, { alertId: alert.id, amount })
  }
  
  return alert
}

/**
 * Get AML alerts
 */
export function getAMLAlerts(filters?: {
  userId?: string
  status?: AMLAlert['status']
  severity?: RiskLevel
  limit?: number
}): AMLAlert[] {
  let filtered = [...amlAlerts]
  
  if (filters?.userId) {
    filtered = filtered.filter(a => a.userId === filters.userId)
  }
  if (filters?.status) {
    filtered = filtered.filter(a => a.status === filters.status)
  }
  if (filters?.severity) {
    filtered = filtered.filter(a => a.severity === filters.severity)
  }
  
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  
  return filters?.limit ? filtered.slice(0, filters.limit) : filtered
}

/**
 * Resolve AML alert
 */
export function resolveAMLAlert(
  alertId: string,
  resolution: string,
  status: 'resolved' | 'escalated' | 'reported'
): boolean {
  const alert = amlAlerts.find(a => a.id === alertId)
  if (!alert) return false
  
  alert.status = status
  alert.resolution = resolution
  alert.resolvedAt = new Date()
  
  return true
}

/**
 * Check against sanctions/watchlists
 */
export function screenAgainstWatchlists(
  firstName: string,
  lastName: string
): { matched: boolean; lists: string[] } {
  const fullName = `${firstName} ${lastName}`.toLowerCase()
  const lists: string[] = []
  
  if (watchlists.has(fullName)) {
    lists.push('Global Watchlist')
  }
  
  if (pepList.has(fullName)) {
    lists.push('Politically Exposed Persons')
  }
  
  return { matched: lists.length > 0, lists }
}

/**
 * Reset daily limits (called daily via cron)
 */
export function resetDailyLimits(): void {
  for (const profile of kycProfiles.values()) {
    profile.limits.remainingDaily = profile.limits.dailyLimit
    profile.updatedAt = new Date()
  }
}

/**
 * Reset monthly limits (called monthly via cron)
 */
export function resetMonthlyLimits(): void {
  for (const profile of kycProfiles.values()) {
    profile.limits.remainingMonthly = profile.limits.monthlyLimit
    profile.updatedAt = new Date()
  }
}

/**
 * Get KYC statistics for admin dashboard
 */
export function getKYCStats(): {
  totalProfiles: number
  byStatus: Record<string, number>
  byTier: Record<string, number>
  byRiskLevel: Record<string, number>
  pendingReview: number
} {
  const stats = {
    totalProfiles: kycProfiles.size,
    byStatus: {} as Record<string, number>,
    byTier: {} as Record<string, number>,
    byRiskLevel: {} as Record<string, number>,
    pendingReview: 0
  }
  
  for (const profile of kycProfiles.values()) {
    stats.byStatus[profile.status] = (stats.byStatus[profile.status] || 0) + 1
    stats.byTier[profile.tier] = (stats.byTier[profile.tier] || 0) + 1
    stats.byRiskLevel[profile.riskLevel] = (stats.byRiskLevel[profile.riskLevel] || 0) + 1
    
    if (profile.status === 'pending' || profile.status === 'under_review') {
      stats.pendingReview++
    }
  }
  
  return stats
}
