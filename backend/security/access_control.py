"""
Role-based access control (RBAC) for BankChase
"""

import logging
from enum import Enum
from typing import List, Optional
from uuid import UUID

logger = logging.getLogger(__name__)


class UserRole(str, Enum):
    """User roles in the system"""

    CUSTOMER = "customer"
    ADMIN = "admin"
    AUDITOR = "auditor"
    COMPLIANCE = "compliance"


class Permission(str, Enum):
    """Available permissions"""

    # Account permissions
    VIEW_OWN_ACCOUNT = "view_own_account"
    VIEW_ALL_ACCOUNTS = "view_all_accounts"
    CREATE_ACCOUNT = "create_account"
    UPDATE_OWN_ACCOUNT = "update_own_account"
    UPDATE_ALL_ACCOUNTS = "update_all_accounts"
    DELETE_ACCOUNT = "delete_account"

    # Transfer permissions
    CREATE_TRANSFER = "create_transfer"
    APPROVE_TRANSFER = "approve_transfer"
    VIEW_OWN_TRANSFERS = "view_own_transfers"
    VIEW_ALL_TRANSFERS = "view_all_transfers"

    # User management
    VIEW_OWN_PROFILE = "view_own_profile"
    VIEW_ALL_USERS = "view_all_users"
    UPDATE_OWN_PROFILE = "update_own_profile"
    UPDATE_USER_ROLE = "update_user_role"
    DELETE_USER = "delete_user"

    # Audit and monitoring
    VIEW_AUDIT_LOGS = "view_audit_logs"
    VIEW_ALERTS = "view_alerts"
    RESOLVE_ALERTS = "resolve_alerts"
    VIEW_SENSITIVE_DATA = "view_sensitive_data"

    # Compliance
    EXPORT_DATA = "export_data"
    GENERATE_REPORTS = "generate_reports"
    MANAGE_ALERTS = "manage_alerts"


class AccessControl:
    """Handle role-based access control"""

    # Define role-to-permissions mapping
    ROLE_PERMISSIONS = {
        UserRole.CUSTOMER: [
            Permission.VIEW_OWN_ACCOUNT,
            Permission.CREATE_ACCOUNT,
            Permission.UPDATE_OWN_ACCOUNT,
            Permission.CREATE_TRANSFER,
            Permission.VIEW_OWN_TRANSFERS,
            Permission.VIEW_OWN_PROFILE,
            Permission.UPDATE_OWN_PROFILE,
        ],
        UserRole.ADMIN: [
            # Admins have all permissions
            Permission.VIEW_ALL_ACCOUNTS,
            Permission.VIEW_OWN_ACCOUNTS,
            Permission.CREATE_ACCOUNT,
            Permission.UPDATE_ALL_ACCOUNTS,
            Permission.DELETE_ACCOUNT,
            Permission.CREATE_TRANSFER,
            Permission.APPROVE_TRANSFER,
            Permission.VIEW_ALL_TRANSFERS,
            Permission.VIEW_ALL_USERS,
            Permission.UPDATE_USER_ROLE,
            Permission.DELETE_USER,
            Permission.VIEW_AUDIT_LOGS,
            Permission.VIEW_ALERTS,
            Permission.RESOLVE_ALERTS,
            Permission.VIEW_SENSITIVE_DATA,
            Permission.EXPORT_DATA,
            Permission.GENERATE_REPORTS,
            Permission.MANAGE_ALERTS,
        ],
        UserRole.AUDITOR: [
            Permission.VIEW_ALL_ACCOUNTS,
            Permission.VIEW_ALL_TRANSFERS,
            Permission.VIEW_ALL_USERS,
            Permission.VIEW_AUDIT_LOGS,
            Permission.VIEW_ALERTS,
            Permission.EXPORT_DATA,
            Permission.GENERATE_REPORTS,
        ],
        UserRole.COMPLIANCE: [
            Permission.VIEW_ALL_ACCOUNTS,
            Permission.VIEW_ALL_TRANSFERS,
            Permission.VIEW_ALL_USERS,
            Permission.VIEW_AUDIT_LOGS,
            Permission.VIEW_SENSITIVE_DATA,
            Permission.EXPORT_DATA,
            Permission.GENERATE_REPORTS,
        ],
    }

    @staticmethod
    def has_permission(user_role: Optional[str], permission: Permission) -> bool:
        """
        Check if user role has a specific permission

        Args:
            user_role: User's role
            permission: Permission to check

        Returns:
            True if user has permission
        """
        try:
            role = UserRole(user_role)
            permissions = AccessControl.ROLE_PERMISSIONS.get(role, [])
            return permission in permissions

        except (ValueError, KeyError):
            logger.warning(f"Unknown role: {user_role}")
            return False

    @staticmethod
    def has_any_permission(user_role: Optional[str], permissions: List[Permission]) -> bool:
        """
        Check if user has any of the specified permissions

        Args:
            user_role: User's role
            permissions: List of permissions to check

        Returns:
            True if user has at least one permission
        """
        return any(
            AccessControl.has_permission(user_role, perm)
            for perm in permissions
        )

    @staticmethod
    def has_all_permissions(user_role: Optional[str], permissions: List[Permission]) -> bool:
        """
        Check if user has all specified permissions

        Args:
            user_role: User's role
            permissions: List of permissions to check

        Returns:
            True if user has all permissions
        """
        return all(
            AccessControl.has_permission(user_role, perm)
            for perm in permissions
        )

    @staticmethod
    def can_view_account(
        user_role: Optional[str], account_user_id: UUID, current_user_id: UUID
    ) -> bool:
        """
        Check if user can view an account

        Args:
            user_role: Viewing user's role
            account_user_id: ID of account owner
            current_user_id: ID of viewing user

        Returns:
            True if user can view account
        """
        # Users can view their own accounts
        if account_user_id == current_user_id:
            return AccessControl.has_permission(user_role, Permission.VIEW_OWN_ACCOUNT)

        # Admins/auditors can view all accounts
        return AccessControl.has_permission(user_role, Permission.VIEW_ALL_ACCOUNTS)

    @staticmethod
    def can_create_transfer(
        user_role: Optional[str], from_user_id: UUID, current_user_id: UUID
    ) -> bool:
        """
        Check if user can create a transfer from an account

        Args:
            user_role: User's role
            from_user_id: Account owner ID
            current_user_id: User creating transfer

        Returns:
            True if user can create transfer
        """
        # Users can only transfer from their own accounts
        if from_user_id != current_user_id:
            # Admins can create transfers on behalf of users
            return AccessControl.has_permission(user_role, Permission.APPROVE_TRANSFER)

        return AccessControl.has_permission(user_role, Permission.CREATE_TRANSFER)

    @staticmethod
    def can_view_sensitive_data(user_role: Optional[str]) -> bool:
        """
        Check if user can view sensitive data (SSN, card numbers, etc.)

        Args:
            user_role: User's role

        Returns:
            True if user can view sensitive data
        """
        return AccessControl.has_permission(user_role, Permission.VIEW_SENSITIVE_DATA)

    @staticmethod
    def can_view_audit_logs(user_role: Optional[str]) -> bool:
        """
        Check if user can view audit logs

        Args:
            user_role: User's role

        Returns:
            True if user can view audit logs
        """
        return AccessControl.has_permission(user_role, Permission.VIEW_AUDIT_LOGS)

    @staticmethod
    def can_manage_alerts(user_role: Optional[str]) -> bool:
        """
        Check if user can manage security alerts

        Args:
            user_role: User's role

        Returns:
            True if user can manage alerts
        """
        return AccessControl.has_permission(user_role, Permission.MANAGE_ALERTS)

    @staticmethod
    def get_user_permissions(user_role: Optional[str]) -> List[Permission]:
        """
        Get all permissions for a user role

        Args:
            user_role: User's role

        Returns:
            List of permissions
        """
        try:
            role = UserRole(user_role)
            return AccessControl.ROLE_PERMISSIONS.get(role, [])

        except ValueError:
            logger.warning(f"Unknown role: {user_role}")
            return []

    @staticmethod
    def get_all_roles() -> List[str]:
        """
        Get all available roles

        Returns:
            List of role names
        """
        return [role.value for role in UserRole]


# Convenience function
async def check_permission(
    user_role: Optional[str], permission: Permission, raise_error: bool = False
) -> bool:
    """
    Check user permission with optional error raising

    Args:
        user_role: User's role
        permission: Permission to check
        raise_error: If True, raise PermissionError if denied

    Returns:
        True if user has permission

    Raises:
        PermissionError: If raise_error=True and user lacks permission
    """
    has_perm = AccessControl.has_permission(user_role, permission)

    if not has_perm and raise_error:
        raise PermissionError(f"User role '{user_role}' cannot {permission.value}")

    return has_perm
