"""
Authentication utilities - JWT tokens and password hashing
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from models import TokenData
from database import execute, fetchrow

# In-memory token blacklist (use Redis in production)
# Format: {token: revoke_time}
_token_blacklist = {}

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET") or os.getenv("SUPABASE_JWT_SECRET") or "dev-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # 15 minutes for access token
REFRESH_TOKEN_EXPIRE_DAYS = 7  # 7 days for refresh token

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def validate_password_strength(password: str) -> dict:
    """Validate password meets security requirements"""
    errors = []
    
    if len(password) < 12:
        errors.append("Password must be at least 12 characters long")
    
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one number")
    
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        errors.append("Password must contain at least one special character")
    
    return {"valid": len(errors) == 0, "errors": errors}


def get_password_hash(password: str) -> str:
    """Hash a password (after validation)"""
    validation = validate_password_strength(password)
    if not validation["valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"Password too weak: {'; '.join(validation['errors'])}"
        )
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token (short-lived)"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token (long-lived)"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def is_token_blacklisted(token: str) -> bool:
    """Check if token is revoked"""
    return token in _token_blacklist


def revoke_token(token: str) -> None:
    """Add token to blacklist (revoke it)"""
    _token_blacklist[token] = datetime.now(timezone.utc)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token"""
    # Check if token is blacklisted
    if is_token_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenData:
    """Get the current authenticated user from JWT token"""
    token = credentials.credentials
    payload = decode_token(token)
    
    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    return TokenData(
        user_id=user_id,
        org_id=payload.get("org_id"),
        role=payload.get("role", "user"),
        email=payload.get("email")
    )


def require_role(allowed_roles: list[str]):
    """Dependency to require specific roles"""
    async def role_checker(current_user: TokenData = Depends(get_current_user)) -> TokenData:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' not authorized for this action"
            )
        return current_user
    return role_checker
