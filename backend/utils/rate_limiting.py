"""
Rate limiting utilities for protecting sensitive endpoints
Uses slowapi for FastAPI-native rate limiting with in-memory storage
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request


class RateLimitConfig:
    """Configuration for rate limiting"""
    TRANSFER_LIMIT = "10/minute"  # 10 transfers per minute per user
    ADMIN_LIMIT = "20/minute"     # 20 admin operations per minute
    DEFAULT_LIMIT = "100/minute"  # 100 requests per minute default


# Initialize limiter with get_remote_address as key_func
# This will be configured per-route to use user_id instead for authenticated routes
limiter = Limiter(key_func=get_remote_address)


async def rate_limit_exception_handler(request: Request, exc: RateLimitExceeded):
    """Custom exception handler for rate limit exceeded"""
    return {
        "detail": "Too many requests. Please try again later.",
        "status_code": 429,
        "retry_after": exc.detail.split("calls in ")[1] if "calls in " in exc.detail else "1m"
    }
