"""
Security middleware for FastAPI
Handles audit logging, permission checking, and alert triggering
"""

import logging
import time
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from security.audit_logger import AuditLogger
from security.access_control import AccessControl, Permission
from security.alert_manager import AlertManager, AlertType, AlertSeverity

logger = logging.getLogger(__name__)


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security features:
    - Audit logging for all requests
    - Rate limiting checks
    - Suspicious activity detection
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.sensitive_endpoints = [
            '/api/users',
            '/api/accounts',
            '/api/transfers',
            '/api/sensitive',
        ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request with security checks

        Args:
            request: HTTP request
            call_next: Next middleware/handler

        Returns:
            HTTP response
        """
        start_time = time.time()

        # Extract request context
        user_id = request.headers.get('X-User-ID')
        user_role = request.headers.get('X-User-Role', 'customer')
        ip_address = request.client.host if request.client else None

        # Log sensitive data access
        if any(endpoint in request.url.path for endpoint in self.sensitive_endpoints):
            if user_id:
                await AuditLogger.log_sensitive_access(
                    user_id=user_id,
                    data_type=request.url.path.split('/')[2],
                    reason=f"{request.method} {request.url.path}",
                )

        try:
            # Process request
            response = await call_next(request)

            # Calculate request duration
            duration = time.time() - start_time

            # Log successful operation
            if user_id and response.status_code < 400:
                await AuditLogger.log_operation(
                    user_id=user_id,
                    operation=request.method,
                    table_name=request.url.path.split('/')[2] if len(request.url.path.split('/')) > 2 else 'unknown',
                    ip_address=ip_address,
                    status='success',
                )

            # Log failed operation
            elif user_id and response.status_code >= 400:
                await AuditLogger.log_operation(
                    user_id=user_id,
                    operation=request.method,
                    table_name=request.url.path.split('/')[2] if len(request.url.path.split('/')) > 2 else 'unknown',
                    ip_address=ip_address,
                    status='failure',
                    error_message=f"HTTP {response.status_code}",
                )

            # Log slow requests (>1 second)
            if duration > 1.0:
                logger.warning(
                    f"Slow request: {request.method} {request.url.path} took {duration:.2f}s"
                )

            return response

        except Exception as e:
            logger.error(f"Security middleware error: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={'detail': 'Internal server error'},
            )


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware for rate limiting based on IP or user
    Triggers alerts on excessive requests
    """

    def __init__(self, app: ASGIApp, requests_per_minute: int = 100):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_counts = {}  # In-memory store (use Redis in production)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Check rate limits and allow/deny request

        Args:
            request: HTTP request
            call_next: Next middleware/handler

        Returns:
            HTTP response or 429 Too Many Requests
        """
        # Get identifier (IP or user ID)
        identifier = request.headers.get('X-User-ID')
        if not identifier:
            identifier = request.client.host if request.client else 'unknown'

        # Check request count
        current_count = self.request_counts.get(identifier, 0)

        if current_count >= self.requests_per_minute:
            # Too many requests
            logger.warning(f"Rate limit exceeded for {identifier}")

            # Create alert
            user_id = request.headers.get('X-User-ID')
            if user_id:
                await AlertManager.create_alert(
                    AlertType.FAILED_LOGIN,  # Reuse alert type
                    user_id=user_id,
                    message="Excessive API requests detected",
                    severity=AlertSeverity.MEDIUM,
                )

            return JSONResponse(
                status_code=429,
                content={'detail': 'Too many requests'},
            )

        # Increment counter
        self.request_counts[identifier] = current_count + 1

        # Process request
        response = await call_next(request)

        return response


class PermissionMiddleware(BaseHTTPMiddleware):
    """
    Middleware to check user permissions on protected endpoints
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        # Define protected endpoints and required permissions
        self.protected_endpoints = {
            '/api/admin': [Permission.VIEW_ALL_USERS],
            '/api/audit': [Permission.VIEW_AUDIT_LOGS],
            '/api/alerts': [Permission.VIEW_ALERTS],
            '/api/sensitive': [Permission.VIEW_SENSITIVE_DATA],
        }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Check user permissions before processing request

        Args:
            request: HTTP request
            call_next: Next middleware/handler

        Returns:
            HTTP response or 403 Forbidden
        """
        user_role = request.headers.get('X-User-Role', 'customer')

        # Check if endpoint is protected
        for protected_path, required_perms in self.protected_endpoints.items():
            if protected_path in request.url.path:
                # Check if user has required permission
                has_permission = any(
                    AccessControl.has_permission(user_role, perm)
                    for perm in required_perms
                )

                if not has_permission:
                    logger.warning(
                        f"Unauthorized access attempt: {user_role} -> {request.url.path}"
                    )
                    return JSONResponse(
                        status_code=403,
                        content={'detail': 'Insufficient permissions'},
                    )

        # Request allowed
        response = await call_next(request)
        return response


class DataMaskingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to mask sensitive data in responses
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Mask sensitive data in response if user doesn't have full access

        Args:
            request: HTTP request
            call_next: Next middleware/handler

        Returns:
            HTTP response with masked data
        """
        user_role = request.headers.get('X-User-Role', 'customer')

        # Get response
        response = await call_next(request)

        # TODO: Implement response data masking based on user role
        # This would require parsing the response body and masking sensitive fields

        return response
