"""
Audit logging utilities for tracking all operations
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from database import execute, fetch, fetchrow

logger = logging.getLogger(__name__)


class AuditLogger:
    """Handle audit logging for security and compliance"""

    @staticmethod
    async def log_operation(
        user_id: UUID,
        operation: str,
        table_name: str,
        record_id: Optional[UUID] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        status: str = "success",
        error_message: Optional[str] = None,
    ) -> bool:
        """
        Log an operation to the audit log

        Args:
            user_id: User performing the operation
            operation: INSERT, UPDATE, DELETE, SELECT
            table_name: Table being accessed
            record_id: ID of the affected record
            old_values: Previous values (for updates/deletes)
            new_values: New values (for inserts/updates)
            ip_address: Client IP address
            status: Operation status (success/failure)
            error_message: Error message if operation failed

        Returns:
            True if logged successfully
        """
        try:
            query = r"""
                INSERT INTO public.audit_log (
                    user_id, operation, table_name, record_id,
                    old_values, new_values, ip_address, timestamp, status, error_message
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8, $9)
            """

            await execute(
                query,
                user_id,
                operation,
                table_name,
                record_id,
                json.dumps(old_values) if old_values else None,
                json.dumps(new_values) if new_values else None,
                ip_address,
                status,
                error_message,
            )

            logger.info(
                f"Audit: {operation} on {table_name} by user {user_id} - {status}"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to log operation: {str(e)}")
            return False

    @staticmethod
    async def log_data_access(
        user_id: UUID,
        table_name: str,
        columns_accessed: List[str],
        record_ids: Optional[List[UUID]] = None,
        ip_address: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> bool:
        """
        Log data access for compliance

        Args:
            user_id: User accessing data
            table_name: Table being accessed
            columns_accessed: List of columns accessed
            record_ids: IDs of records accessed
            ip_address: Client IP address
            reason: Reason for access

        Returns:
            True if logged successfully
        """
        try:
            query = r"""
                INSERT INTO public.data_access_log (
                    user_id, table_name, columns_accessed, record_ids,
                    access_type, ip_address, timestamp, reason
                )
                VALUES ($1, $2, $3, $4, 'SELECT', $5, CURRENT_TIMESTAMP, $6)
            """

            await execute(
                query,
                user_id,
                table_name,
                columns_accessed,
                record_ids,
                ip_address,
                reason,
            )

            logger.info(f"Data access logged: {table_name} by user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to log data access: {str(e)}")
            return False

    @staticmethod
    async def log_sensitive_access(
        user_id: UUID,
        data_type: str,
        record_id: Optional[UUID] = None,
        reason: Optional[str] = None,
    ) -> bool:
        """
        Log access to sensitive data (SSN, card numbers, etc.)

        Args:
            user_id: User accessing sensitive data
            data_type: Type of sensitive data (ssn, card_number, etc.)
            record_id: ID of affected record
            reason: Reason for accessing sensitive data

        Returns:
            True if logged successfully
        """
        try:
            query = r"""
                INSERT INTO public.sensitive_data_access (
                    user_id, data_type, record_id, accessed_by,
                    access_timestamp, access_reason
                )
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
            """

            await execute(
                query, user_id, data_type, record_id, user_id, reason
            )

            logger.warning(
                f"Sensitive data access: {data_type} by user {user_id}"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to log sensitive access: {str(e)}")
            return False

    @staticmethod
    async def get_user_activity(
        user_id: UUID, days: int = 30
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get user's activity summary for specified days

        Args:
            user_id: User ID
            days: Number of days to look back

        Returns:
            List of activity records
        """
        try:
            query = r"""
                SELECT
                    operation,
                    table_name,
                    COUNT(*) as count,
                    MAX(timestamp) as last_activity
                FROM public.audit_log
                WHERE user_id = $1
                    AND timestamp > CURRENT_TIMESTAMP - INTERVAL '1 day' * $2
                GROUP BY operation, table_name
                ORDER BY last_activity DESC
            """

            results = await fetch(query, user_id, days)
            return [dict(row) for row in results]

        except Exception as e:
            logger.error(f"Failed to get user activity: {str(e)}")
            return None

    @staticmethod
    async def get_record_history(
        table_name: str, record_id: UUID
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get complete history of changes to a record

        Args:
            table_name: Table name
            record_id: Record ID

        Returns:
            List of historical changes
        """
        try:
            query = r"""
                SELECT
                    operation,
                    user_id,
                    old_values,
                    new_values,
                    timestamp
                FROM public.audit_log
                WHERE table_name = $1
                    AND record_id = $2
                ORDER BY timestamp DESC
            """

            results = await fetch(query, table_name, record_id)
            return [dict(row) for row in results]

        except Exception as e:
            logger.error(f"Failed to get record history: {str(e)}")
            return None

    @staticmethod
    async def cleanup_old_logs(days_to_keep: int = 365) -> Optional[int]:
        """
        Delete audit logs older than specified days

        Args:
            days_to_keep: Number of days to retain logs

        Returns:
            Number of deleted records
        """
        try:
            query = r"""
                DELETE FROM public.audit_log
                WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 day' * $1
            """

            result = await execute(query, days_to_keep)
            logger.info(f"Cleaned up old audit logs (older than {days_to_keep} days)")
            return result

        except Exception as e:
            logger.error(f"Failed to cleanup old logs: {str(e)}")
            return None


# Convenience functions
async def log_operation(**kwargs) -> bool:
    """Shorthand for AuditLogger.log_operation()"""
    return await AuditLogger.log_operation(**kwargs)


async def get_record_history(table_name: str, record_id: UUID) -> Optional[List]:
    """Shorthand for AuditLogger.get_record_history()"""
    return await AuditLogger.get_record_history(table_name, record_id)
