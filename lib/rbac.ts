export type UserRole = 'customer' | 'admin' | 'auditor'

export interface Permission {
  role: UserRole
  action: string
  resource: string
}

// Strict role-based permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  customer: [
    // Customers can only read/update their own profile and balance
    { role: 'customer', action: 'read', resource: 'own_profile' },
    { role: 'customer', action: 'update', resource: 'own_profile' },
    { role: 'customer', action: 'read', resource: 'own_account' },
    { role: 'customer', action: 'read', resource: 'own_transactions' },
    { role: 'customer', action: 'create', resource: 'own_transfers' },
  ],
  admin: [
    // Admins have full access to system
    { role: 'admin', action: 'create', resource: 'accounts' },
    { role: 'admin', action: 'read', resource: 'accounts' },
    { role: 'admin', action: 'update', resource: 'accounts' },
    { role: 'admin', action: 'delete', resource: 'accounts' },
    { role: 'admin', action: 'read', resource: 'users' },
    { role: 'admin', action: 'update', resource: 'users' },
    { role: 'admin', action: 'delete', resource: 'users' },
    { role: 'admin', action: 'read', resource: 'transactions' },
    { role: 'admin', action: 'read', resource: 'audit_logs' },
    { role: 'admin', action: 'access', resource: 'admin_dashboard' },
  ],
  auditor: [
    // Auditors can read audit logs and transaction history
    { role: 'auditor', action: 'read', resource: 'audit_logs' },
    { role: 'auditor', action: 'read', resource: 'transactions' },
    { role: 'auditor', action: 'read', resource: 'login_history' },
  ],
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
}

/**
 * Check if user has permission for action on resource
 */
export function checkPermission(user: User, action: string, resource: string): boolean {
  if (!user?.role) return false

  const rolePermissions = ROLE_PERMISSIONS[user.role] || []
  return rolePermissions.some(
    (perm) => perm.action === action && perm.resource === resource
  )
}

/**
 * Check if user has specific role
 */
export function hasRole(user: User, role: UserRole): boolean {
  return user?.role === role
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User): boolean {
  return hasRole(user, 'admin')
}

/**
 * Check if user is auditor
 */
export function isAuditor(user: User): boolean {
  return hasRole(user, 'auditor')
}

/**
 * Check if user is customer
 */
export function isCustomer(user: User): boolean {
  return hasRole(user, 'customer')
}

/**
 * Check if user can access admin dashboard
 */
export function canAccessAdminDashboard(user: User): boolean {
  return checkPermission(user, 'access', 'admin_dashboard')
}

/**
 * Check if user can access resource belonging to another user
 * Customers can only access their own resources
 * Admins can access all resources
 */
export async function canAccessResource(
  currentUserId: string,
  resourceUserId: string,
  userRole: UserRole
): Promise<boolean> {
  // Users can always access their own resources
  if (currentUserId === resourceUserId) return true

  // Only admins can access other users' resources
  if (userRole === 'admin') return true

  // Deny access for customers and auditors trying to access other resources
  return false
}

/**
 * Get user role from database
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('[v0] Error fetching user role:', error)
    return null
  }

  return data?.role as UserRole
}

/**
 * Log admin action to audit table
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetResource: string,
  targetUserId?: string,
  ipAddress?: string,
  userAgent?: string,
  details?: Record<string, any>
) {
  try {
    const supabase = await createClient()

    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action_type: action,
      target_resource: targetResource,
      target_user_id: targetUserId,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: details || null,
    })
  } catch (error) {
    console.error('[v0] Failed to log admin action:', error)
  }
}

/**
 * Log login attempt
 */
export async function logLoginAttempt(
  userId: string,
  ipAddress: string,
  userAgent: string,
  deviceName?: string,
  success: boolean = true,
  failureReason?: string
) {
  try {
    const supabase = await createClient()

    await supabase.from('login_history').insert({
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_name: deviceName || 'Unknown',
      success,
      failure_reason: failureReason,
    })
  } catch (error) {
    console.error('[v0] Failed to log login attempt:', error)
  }
}
