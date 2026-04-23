/**
 * Session Manager - Handles user sessions with Supabase fallback
 * Ensures users can work even if Supabase is temporarily unavailable
 */

export interface UserSession {
  userId: string
  email: string
  name: string
  username: string
  accountNumber?: string
  maskedAccountNumber?: string
  createdAt: string
  loginTime: string
}

export interface UserAccount {
  accountId: string
  accountNumber: string
  maskedAccountNumber: string
  accountType: string
  accountName: string
  balance: number
  availableBalance: number
  routingNumber: string
  status: string
  createdAt: string
}

/**
 * Store user session
 */
export function storeUserSession(session: UserSession): void {
  localStorage.setItem('chase_session', JSON.stringify(session))
  localStorage.setItem('chase_session_timestamp', new Date().toISOString())
  localStorage.setItem('chase_logged_in', 'true')
}

/**
 * Get current user session
 */
export function getUserSession(): UserSession | null {
  const session = localStorage.getItem('chase_session')
  return session ? JSON.parse(session) : null
}

/**
 * Store user account data
 */
export function storeUserAccount(account: UserAccount): void {
  const accounts = getUserAccounts()
  const existing = accounts.findIndex(a => a.accountId === account.accountId)
  
  if (existing >= 0) {
    accounts[existing] = account
  } else {
    accounts.push(account)
  }
  
  localStorage.setItem('chase_user_accounts', JSON.stringify(accounts))
}

/**
 * Get user accounts
 */
export function getUserAccounts(): UserAccount[] {
  const accounts = localStorage.getItem('chase_user_accounts')
  return accounts ? JSON.parse(accounts) : []
}

/**
 * Clear user session
 */
export function clearUserSession(): void {
  localStorage.removeItem('chase_session')
  localStorage.removeItem('chase_session_timestamp')
  localStorage.removeItem('chase_logged_in')
  localStorage.removeItem('chase_user_accounts')
  localStorage.removeItem('chase_current_user')
  localStorage.removeItem('chase_user_data')
  localStorage.removeItem('chase_user_id')
  localStorage.removeItem('chase_user_role')
  localStorage.removeItem('chase_user_name')
  localStorage.removeItem('chase_user_email')
  localStorage.removeItem('chase_session_token')
  localStorage.removeItem('chase_last_login')
}

/**
 * Check if user session is valid
 */
export function isSessionValid(): boolean {
  const session = getUserSession()
  if (!session) return false
  
  // Check if session is not older than 7 days
  const timestamp = localStorage.getItem('chase_session_timestamp')
  if (!timestamp) return false
  
  const sessionDate = new Date(timestamp)
  const now = new Date()
  const daysDiff = (now.getTime() - sessionDate.getTime()) / (1000 * 3600 * 24)
  
  return daysDiff < 7
}

/**
 * Update user account balance (for demo/offline)
 */
export function updateAccountBalance(accountId: string, newBalance: number): void {
  const accounts = getUserAccounts()
  const account = accounts.find(a => a.accountId === accountId)
  
  if (account) {
    account.balance = newBalance
    account.availableBalance = newBalance
    storeUserAccount(account)
  }
}

/**
 * Create a new user account record
 */
export function createAccountRecord(
  accountId: string,
  accountNumber: string,
  maskedAccountNumber: string,
  accountType: string = 'checking',
  accountName: string = 'My Account'
): UserAccount {
  return {
    accountId,
    accountNumber,
    maskedAccountNumber,
    accountType,
    accountName,
    balance: 0,
    availableBalance: 0,
    routingNumber: '021000021', // Chase routing number
    status: 'active',
    createdAt: new Date().toISOString()
  }
}
