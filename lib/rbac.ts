export type UserRole = 'admin' | 'editor' | 'viewer'

export interface Permission {
  role: UserRole
  action: string
  resource: string
}

// Define role-based permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Full access to all resources
    { role: 'admin', action: 'create', resource: 'accounts' },
    { role: 'admin', action: 'read', resource: 'accounts' },
    { role: 'admin', action: 'update', resource: 'accounts' },
    { role: 'admin', action: 'delete', resource: 'accounts' },
    { role: 'admin', action: 'create', resource: 'transactions' },
    { role: 'admin', action: 'read', resource: 'transactions' },
    { role: 'admin', action: 'update', resource: 'transactions' },
    { role: 'admin', action: 'delete', resource: 'transactions' },
    { role: 'admin', action: 'read', resource: 'users' },
    { role: 'admin', action: 'update', resource: 'users' },
    { role: 'admin', action: 'access', resource: 'admin_dashboard' },
  ],
  editor: [
    // Can create and read, limited update
    { role: 'editor', action: 'create', resource: 'accounts' },
    { role: 'editor', action: 'read', resource: 'accounts' },
    { role: 'editor', action: 'update', resource: 'accounts' },
    { role: 'editor', action: 'create', resource: 'transactions' },
    { role: 'editor', action: 'read', resource: 'transactions' },
    { role: 'editor', action: 'read', resource: 'users' },
  ],
  viewer: [
    // Read-only access
    { role: 'viewer', action: 'read', resource: 'accounts' },
    { role: 'viewer', action: 'read', resource: 'transactions' },
    { role: 'viewer', action: 'read', resource: 'users' },
  ],
}

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  permissions: Permission[]
}

export function checkPermission(user: User, action: string, resource: string): boolean {
  if (!user || !user.role) return false

  const rolePermissions = ROLE_PERMISSIONS[user.role] || []
  return rolePermissions.some(
    (perm) => perm.action === action && perm.resource === resource
  )
}

export function hasRole(user: User, role: UserRole): boolean {
  return user?.role === role
}

export function isAdmin(user: User): boolean {
  return hasRole(user, 'admin')
}

export function isEditor(user: User): boolean {
  return hasRole(user, 'editor')
}

export function isViewer(user: User): boolean {
  return hasRole(user, 'viewer')
}

export function canAccessAdminDashboard(user: User): boolean {
  return checkPermission(user, 'access', 'admin_dashboard')
}
