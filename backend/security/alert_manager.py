"""
Real-time alert management for suspicious activities
Integrates with QStash for async notifications
"""

import logging
import json
from typing import Any, Dict, List, Optional
from enum import Enum
from uuid import UUID

from database import execute, fetch, fetchrow

logger = logging.getLogger(__name__)


class AlertSeverity(str, Enum):
    """Alert severity levels"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertType(str, Enum):
    """Types of alerts"""

    LARGE_TRANSFER = "large_transfer"
    FAILED_LOGIN = "failed_login"
    UNUSUAL_ACCESS_TIME = "unusual_access_time"
    BULK_DATA_ACCESS = "bulk_data_access"
    SENSITIVE_DATA_ACCESS = "sensitive_data_access"
    UNUSUAL_LOCATION = "unusual_location"
    CONCURRENT_LOGIN = "concurrent_login"
    DATA_DELETION = "data_deletion"
    FAILED_TRANSFER = "failed_transfer"
    ACCOUNT_STATUS_CHANGE = "account_status_change"


class AlertManager:
    """Manage security alerts and notifications"""

    @staticmethod
    async def create_alert(
        alert_type: AlertType,
        user_id: Optional[UUID] = None,
        message: str = "",
        severity: AlertSeverity = AlertSeverity.MEDIUM,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        send_notification: bool = True,
    ) -> Optional[int]:
        """
        Create a new security alert

        Args:
            alert_type: Type of alert
            user_id: User ID associated with alert
            message: Alert message
            severity: Alert severity level
            details: Additional details as JSON
            ip_address: Client IP address
            send_notification: Whether to send notification

        Returns:
            Alert ID if created successfully
        """
        try:
            query = r"""
                INSERT INTO public.alerts (
                    alert_type, severity, user_id, message, details, ip_address
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            """

            alert_id = await fetchrow(
                query,
                alert_type.value,
                severity.value,
                user_id,
                message,
                json.dumps(details) if details else None,
                ip_address,
            )

            logger.warning(
                f"Alert created: {alert_type.value} - {severity.value} - {message}"
            )

            # Send notification if configured
            if send_notification:
                await AlertManager._send_notification(
                    alert_type, severity, user_id, message, details
                )

            return alert_id['id'] if alert_id else None

        except Exception as e:
            logger.error(f"Failed to create alert: {str(e)}")
            return None

    @staticmethod
    async def check_large_transfer(user_id: UUID, amount: float) -> bool:
        """
        Check if transfer amount triggers alert

        Args:
            user_id: User creating transfer
            amount: Transfer amount

        Returns:
            True if alert was triggered
        """
        try:
            # Get large transfer threshold
            query = r"""
                SELECT threshold_value FROM public.alert_configurations
                WHERE alert_type = 'large_transfer' AND enabled = TRUE
            """

            config = await fetchrow(query)

            if config and amount > float(config['threshold_value']):
                await AlertManager.create_alert(
                    AlertType.LARGE_TRANSFER,
                    user_id=user_id,
                    message=f"Large transfer of ${amount:,.2f} initiated",
                    severity=AlertSeverity.MEDIUM,
                    details={'amount': amount, 'user_id': str(user_id)},
                )
                return True

            return False

        except Exception as e:
            logger.error(f"Failed to check large transfer: {str(e)}")
            return False

    @staticmethod
    async def check_failed_login(user_id: UUID, ip_address: Optional[str] = None) -> bool:
        """
        Check if failed login attempts trigger alert

        Args:
            user_id: User with failed login
            ip_address: Client IP address

        Returns:
            True if alert was triggered
        """
        try:
            # Count failed logins in last 15 minutes
            query = r"""
                SELECT COUNT(*) as count FROM public.login_history
                WHERE user_id = $1
                    AND success = FALSE
                    AND created_at > CURRENT_TIMESTAMP - INTERVAL '15 minutes'
            """

            result = await fetchrow(query, user_id)
            failed_count = result['count'] if result else 0

            # Threshold is 5 failed attempts
            if failed_count >= 5:
                await AlertManager.create_alert(
                    AlertType.FAILED_LOGIN,
                    user_id=user_id,
                    message=f"{failed_count} failed login attempts in 15 minutes",
                    severity=AlertSeverity.HIGH,
                    details={'failed_attempts': failed_count, 'ip_address': ip_address},
                    ip_address=ip_address,
                )
                return True

            return False

        except Exception as e:
            logger.error(f"Failed to check login attempts: {str(e)}")
            return False

    @staticmethod
    async def check_bulk_access(
        user_id: UUID, table_name: str, record_count: int
    ) -> bool:
        """
        Check if bulk data access triggers alert

        Args:
            user_id: User accessing data
            table_name: Table being accessed
            record_count: Number of records accessed

        Returns:
            True if alert was triggered
        """
        try:
            # Get bulk access threshold
            query = r"""
                SELECT threshold_value FROM public.alert_configurations
                WHERE alert_type = 'bulk_data_access' AND enabled = TRUE
            """

            config = await fetchrow(query)
            threshold = int(config['threshold_value']) if config else 100

            if record_count > threshold:
                await AlertManager.create_alert(
                    AlertType.BULK_DATA_ACCESS,
                    user_id=user_id,
                    message=f"Bulk access of {record_count} records from {table_name}",
                    severity=AlertSeverity.HIGH,
                    details={'table': table_name, 'record_count': record_count},
                )
                return True

            return False

        except Exception as e:
            logger.error(f"Failed to check bulk access: {str(e)}")
            return False

    @staticmethod
    async def check_sensitive_access(
        user_id: UUID, data_type: str, record_id: Optional[UUID] = None
    ) -> bool:
        """
        Alert when sensitive data is accessed

        Args:
            user_id: User accessing sensitive data
            data_type: Type of sensitive data
            record_id: Record being accessed

        Returns:
            True if alert was triggered
        """
        try:
            if data_type.lower() in [
                'ssn',
                'card_number',
                'cvv',
                'bank_account',
                'drivers_license',
            ]:
                await AlertManager.create_alert(
                    AlertType.SENSITIVE_DATA_ACCESS,
                    user_id=user_id,
                    message=f"Sensitive data accessed: {data_type}",
                    severity=AlertSeverity.MEDIUM,
                    details={'data_type': data_type, 'record_id': str(record_id)},
                )
                return True

            return False

        except Exception as e:
            logger.error(f"Failed to check sensitive access: {str(e)}")
            return False

    @staticmethod
    async def resolve_alert(
        alert_id: int, resolution_notes: Optional[str] = None
    ) -> bool:
        """
        Mark an alert as resolved

        Args:
            alert_id: Alert ID
            resolution_notes: Notes about resolution

        Returns:
            True if resolved successfully
        """
        try:
            query = r"""
                UPDATE public.alerts
                SET resolved = TRUE, resolved_at = CURRENT_TIMESTAMP
                WHERE id = $1
            """

            await execute(query, alert_id)
            logger.info(f"Alert {alert_id} resolved: {resolution_notes}")
            return True

        except Exception as e:
            logger.error(f"Failed to resolve alert: {str(e)}")
            return False

    @staticmethod
    async def get_unresolved_alerts(limit: int = 100) -> Optional[List[Dict]]:
        """
        Get all unresolved alerts

        Args:
            limit: Maximum number of alerts to return

        Returns:
            List of unresolved alerts
        """
        try:
            query = r"""
                SELECT id, alert_type, severity, user_id, message, created_at
                FROM public.alerts
                WHERE resolved = FALSE
                ORDER BY created_at DESC
                LIMIT $1
            """

            results = await fetch(query, limit)
            return [dict(row) for row in results]

        except Exception as e:
            logger.error(f"Failed to get unresolved alerts: {str(e)}")
            return None

    @staticmethod
    async def get_alerts_by_user(user_id: UUID, days: int = 30) -> Optional[List[Dict]]:
        """
        Get alerts related to a specific user

        Args:
            user_id: User ID
            days: Number of days to look back

        Returns:
            List of user's alerts
        """
        try:
            query = r"""
                SELECT id, alert_type, severity, message, created_at, resolved
                FROM public.alerts
                WHERE user_id = $1
                    AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 day' * $2
                ORDER BY created_at DESC
            """

            results = await fetch(query, user_id, days)
            return [dict(row) for row in results]

        except Exception as e:
            logger.error(f"Failed to get user alerts: {str(e)}")
            return None

    @staticmethod
    async def get_alerts_by_severity(
        severity: AlertSeverity, limit: int = 50
    ) -> Optional[List[Dict]]:
        """
        Get alerts by severity level

        Args:
            severity: Severity level to filter
            limit: Maximum number of alerts

        Returns:
            List of alerts
        """
        try:
            query = r"""
                SELECT id, alert_type, user_id, message, created_at
                FROM public.alerts
                WHERE severity = $1
                ORDER BY created_at DESC
                LIMIT $2
            """

            results = await fetch(query, severity.value, limit)
            return [dict(row) for row in results]

        except Exception as e:
            logger.error(f"Failed to get alerts by severity: {str(e)}")
            return None

    @staticmethod
    async def _send_notification(
        alert_type: AlertType,
        severity: AlertSeverity,
        user_id: Optional[UUID],
        message: str,
        details: Optional[Dict],
    ) -> None:
        """
        Send alert notification via QStash

        Args:
            alert_type: Type of alert
            severity: Severity level
            user_id: User ID
            message: Alert message
            details: Additional details
        """
        try:
            # TODO: Integrate with QStash to send notifications
            # This will be called by the backend when an alert is created
            logger.info(
                f"Notification queued for alert: {alert_type.value} - {severity.value}"
            )

        except Exception as e:
            logger.error(f"Failed to send notification: {str(e)}")


# Convenience function
async def create_alert(**kwargs) -> Optional[int]:
    """Shorthand for AlertManager.create_alert()"""
    return await AlertManager.create_alert(**kwargs)
