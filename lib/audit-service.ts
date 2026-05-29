/**
 * Audit Logging Service
 * Comprehensive logging for PCI DSS compliance and security monitoring
 */

export type AuditEventType =
  | 'auth_login'
  | 'auth_logout'
  | 'auth_failed'
  | 'auth_mfa_success'
  | 'auth_mfa_failed'
  | 'card_tokenized'
  | 'card_detokenized'
  | 'card_deleted'
  | 'transaction_initiated'
  | 'transaction_completed'
  | 'transaction_failed'
  | 'kyc_verification_started'
  | 'kyc_verification_completed'
  | 'kyc_verification_failed'
  | 'account_created'
  | 'account_updated'
  | 'account_locked'
  | 'account_unlocked'
  | 'permission_changed'
  | 'admin_action'
  | 'data_export'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface AuditLogEntry {
  id: string
  timestamp: Date
  eventType: AuditEventType
  severity: AuditSeverity
  userId?: string
  userEmail?: string
  userRole?: string
  ipAddress?: string
  userAgent?: string
  resourceType?: string
  resourceId?: string
  action: string
  details: Record<string, unknown>
  metadata: {
    sessionId?: string
    requestId?: string
    correlationId?: string
    deviceFingerprint?: string
    geoLocation?: {
      country?: string
      city?: string
      region?: string
    }
  }
  pciRelevant: boolean
  success: boolean
}

// In-memory audit log storage (in production, use persistent storage)
const auditLogs: AuditLogEntry[] = []

/**
 * Generate unique ID for audit entries
 */
function generateAuditId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `audit_${timestamp}_${random}`
}

/**
 * Determine severity based on event type
 */
function getSeverityForEvent(eventType: AuditEventType, success: boolean): AuditSeverity {
  if (!success) {
    if (['auth_failed', 'auth_mfa_failed', 'kyc_verification_failed'].includes(eventType)) {
      return 'warning'
    }
    if (['transaction_failed', 'suspicious_activity'].includes(eventType)) {
      return 'error'
    }
  }
  
  if (['admin_action', 'permission_changed', 'account_locked'].includes(eventType)) {
    return 'warning'
  }
  
  if (['suspicious_activity', 'rate_limit_exceeded'].includes(eventType)) {
    return 'critical'
  }
  
  return 'info'
}

/**
 * Check if event is PCI DSS relevant
 */
function isPciRelevant(eventType: AuditEventType): boolean {
  const pciEvents: AuditEventType[] = [
    'auth_login',
    'auth_logout',
    'auth_failed',
    'auth_mfa_success',
    'auth_mfa_failed',
    'card_tokenized',
    'card_detokenized',
    'card_deleted',
    'transaction_initiated',
    'transaction_completed',
    'transaction_failed',
    'admin_action',
    'permission_changed',
    'data_export'
  ]
  
  return pciEvents.includes(eventType)
}

/**
 * Create an audit log entry
 */
export function createAuditLog(
  eventType: AuditEventType,
  action: string,
  options: {
    userId?: string
    userEmail?: string
    userRole?: string
    ipAddress?: string
    userAgent?: string
    resourceType?: string
    resourceId?: string
    details?: Record<string, unknown>
    metadata?: AuditLogEntry['metadata']
    success?: boolean
  } = {}
): AuditLogEntry {
  const success = options.success ?? true
  
  const entry: AuditLogEntry = {
    id: generateAuditId(),
    timestamp: new Date(),
    eventType,
    severity: getSeverityForEvent(eventType, success),
    userId: options.userId,
    userEmail: options.userEmail,
    userRole: options.userRole,
    ipAddress: options.ipAddress || 'unknown',
    userAgent: options.userAgent,
    resourceType: options.resourceType,
    resourceId: options.resourceId,
    action,
    details: options.details || {},
    metadata: options.metadata || {},
    pciRelevant: isPciRelevant(eventType),
    success
  }
  
  // Store in memory
  auditLogs.push(entry)
  
  // Keep only last 10000 entries in memory
  if (auditLogs.length > 10000) {
    auditLogs.shift()
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUDIT] ${entry.severity.toUpperCase()}: ${entry.action}`, {
      eventType: entry.eventType,
      userId: entry.userId,
      success: entry.success
    })
  }
  
  return entry
}

/**
 * Query audit logs
 */
export function queryAuditLogs(filters: {
  userId?: string
  eventType?: AuditEventType
  severity?: AuditSeverity
  startDate?: Date
  endDate?: Date
  pciOnly?: boolean
  success?: boolean
  limit?: number
  offset?: number
}): { logs: AuditLogEntry[]; total: number } {
  let filtered = [...auditLogs]
  
  if (filters.userId) {
    filtered = filtered.filter(log => log.userId === filters.userId)
  }
  
  if (filters.eventType) {
    filtered = filtered.filter(log => log.eventType === filters.eventType)
  }
  
  if (filters.severity) {
    filtered = filtered.filter(log => log.severity === filters.severity)
  }
  
  if (filters.startDate) {
    filtered = filtered.filter(log => log.timestamp >= filters.startDate!)
  }
  
  if (filters.endDate) {
    filtered = filtered.filter(log => log.timestamp <= filters.endDate!)
  }
  
  if (filters.pciOnly) {
    filtered = filtered.filter(log => log.pciRelevant)
  }
  
  if (filters.success !== undefined) {
    filtered = filtered.filter(log => log.success === filters.success)
  }
  
  // Sort by timestamp descending
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  
  const total = filtered.length
  const offset = filters.offset || 0
  const limit = filters.limit || 100
  
  return {
    logs: filtered.slice(offset, offset + limit),
    total
  }
}

/**
 * Get audit statistics
 */
export function getAuditStats(startDate?: Date, endDate?: Date): {
  totalEvents: number
  byEventType: Record<string, number>
  bySeverity: Record<string, number>
  successRate: number
  failedLogins: number
  suspiciousActivities: number
} {
  let filtered = [...auditLogs]
  
  if (startDate) {
    filtered = filtered.filter(log => log.timestamp >= startDate)
  }
  
  if (endDate) {
    filtered = filtered.filter(log => log.timestamp <= endDate)
  }
  
  const byEventType: Record<string, number> = {}
  const bySeverity: Record<string, number> = {}
  let successCount = 0
  let failedLogins = 0
  let suspiciousActivities = 0
  
  for (const log of filtered) {
    byEventType[log.eventType] = (byEventType[log.eventType] || 0) + 1
    bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1
    
    if (log.success) successCount++
    if (log.eventType === 'auth_failed') failedLogins++
    if (log.eventType === 'suspicious_activity') suspiciousActivities++
  }
  
  return {
    totalEvents: filtered.length,
    byEventType,
    bySeverity,
    successRate: filtered.length > 0 ? (successCount / filtered.length) * 100 : 100,
    failedLogins,
    suspiciousActivities
  }
}

/**
 * Export audit logs for compliance reporting
 */
export function exportAuditLogs(filters: {
  startDate: Date
  endDate: Date
  pciOnly?: boolean
}): string {
  const { logs } = queryAuditLogs({
    ...filters,
    limit: 100000 // Export all matching logs
  })
  
  // Log the export action
  createAuditLog('data_export', 'Audit logs exported for compliance reporting', {
    details: {
      startDate: filters.startDate.toISOString(),
      endDate: filters.endDate.toISOString(),
      recordCount: logs.length,
      pciOnly: filters.pciOnly
    }
  })
  
  return JSON.stringify(logs, null, 2)
}

/**
 * Convenience logging functions
 */
export const audit = {
  login: (userId: string, email: string, success: boolean, ip?: string, userAgent?: string) =>
    createAuditLog(success ? 'auth_login' : 'auth_failed', 
      success ? `User ${email} logged in` : `Failed login attempt for ${email}`,
      { userId, userEmail: email, ipAddress: ip, userAgent, success }
    ),
  
  logout: (userId: string, email: string) =>
    createAuditLog('auth_logout', `User ${email} logged out`, 
      { userId, userEmail: email }
    ),
  
  mfa: (userId: string, email: string, success: boolean) =>
    createAuditLog(success ? 'auth_mfa_success' : 'auth_mfa_failed',
      success ? `MFA verification successful for ${email}` : `MFA verification failed for ${email}`,
      { userId, userEmail: email, success }
    ),
  
  cardTokenized: (userId: string, lastFour: string, brand: string) =>
    createAuditLog('card_tokenized', `Card ending in ${lastFour} tokenized`,
      { userId, details: { lastFour, brand } }
    ),
  
  transaction: (userId: string, type: string, amount: number, success: boolean, details?: Record<string, unknown>) =>
    createAuditLog(success ? 'transaction_completed' : 'transaction_failed',
      `${type} transaction of $${amount.toFixed(2)} ${success ? 'completed' : 'failed'}`,
      { userId, details: { type, amount, ...details }, success }
    ),
  
  kycStarted: (userId: string, email: string) =>
    createAuditLog('kyc_verification_started', `KYC verification started for ${email}`,
      { userId, userEmail: email }
    ),
  
  kycCompleted: (userId: string, email: string, status: string) =>
    createAuditLog('kyc_verification_completed', `KYC verification completed: ${status}`,
      { userId, userEmail: email, details: { status } }
    ),
  
  adminAction: (adminId: string, action: string, targetUser?: string, details?: Record<string, unknown>) =>
    createAuditLog('admin_action', action,
      { userId: adminId, userRole: 'admin', resourceId: targetUser, details }
    ),
  
  suspiciousActivity: (userId: string | undefined, description: string, details?: Record<string, unknown>) =>
    createAuditLog('suspicious_activity', description,
      { userId, details, success: false }
    )
}
