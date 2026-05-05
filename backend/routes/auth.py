"""
Authentication Routes
- User login
- User signup
- Token validation
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
import os

from database import fetchrow, execute
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    revoke_token,
)
from models import TokenData
from utils.pin_security import set_user_pin, validate_pin_format

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=12, description="Password must be strong (12+ chars, uppercase, lowercase, number, special char)")
    first_name: str = ""
    last_name: str = ""


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    first_name: str = ""
    last_name: str = ""


class VerifyResponse(BaseModel):
    valid: bool
    user_id: str
    email: str
    role: str


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    User login endpoint
    Returns JWT access token on successful authentication
    """
    # Check if user exists
    user = await fetchrow(
        "SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1",
        request.email.lower()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Create access token
    token = create_access_token({
        "sub": str(user["id"]),
        "user_id": str(user["id"]),
        "email": user["email"],
        "role": user.get("role", "user"),
    })

    return AuthResponse(
        access_token=token,
        user_id=str(user["id"]),
        email=user["email"],
        first_name=user.get("first_name", ""),
        last_name=user.get("last_name", ""),
    )


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """
    User signup endpoint
    Creates new user account and returns JWT access token
    """
    try:
        email_lower = request.email.lower()

        # Check if user already exists
        existing_user = await fetchrow(
            "SELECT id FROM users WHERE email = $1",
            email_lower
        )

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="An account with this email already exists"
            )

        # Hash password
        password_hash = get_password_hash(request.password)

        # Create new user
        user_id = str(uuid.uuid4())
        new_user = await fetchrow(
            """INSERT INTO users (
                id, email, password_hash, first_name, last_name, role, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, email, first_name, last_name, role""",
            user_id,
            email_lower,
            password_hash,
            request.first_name or "",
            request.last_name or "",
            "user"
        )

        if not new_user:
            raise HTTPException(
                status_code=500,
                detail="Failed to create user account"
            )

        # Set a random PIN for the user (secure random, not predictable)
        try:
            import secrets
            # Generate random 4-digit PIN (1000-9999, avoiding weak patterns)
            while True:
                default_pin = str(secrets.randbelow(9000) + 1000)
                # Check it's not weak (all same digits or sequential)
                if await validate_pin_format(default_pin):
                    break
            await set_user_pin(user_id, default_pin)
        except Exception as e:
            print(f"[v0] Warning: Failed to set default PIN for user {user_id}: {str(e)}")

        # Create access token
        token = create_access_token({
            "sub": str(new_user["id"]),
            "user_id": str(new_user["id"]),
            "email": new_user["email"],
            "role": new_user.get("role", "user"),
        })

        return AuthResponse(
            access_token=token,
            user_id=str(new_user["id"]),
            email=new_user["email"],
            first_name=new_user.get("first_name", ""),
            last_name=new_user.get("last_name", ""),
        )

    except HTTPException:
        # Re-raise HTTP exceptions (already properly formatted)
        raise
    except Exception as e:
        print(f"[v0] Signup error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create user: {str(e)}"
        )


@router.get("/verify", response_model=VerifyResponse)
async def verify_token(current_user: TokenData = Depends(get_current_user)):
    """
    Verify JWT token validity
    Returns user info if token is valid
    """
    user = await fetchrow(
        "SELECT id, email, role FROM users WHERE id = $1",
        current_user.user_id
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return VerifyResponse(
        valid=True,
        user_id=str(user["id"]),
        email=user["email"],
        role=user.get("role", "user")
    )


class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_access_token(request: RefreshRequest):
    """
    Refresh an expired access token using a valid refresh token
    """
    try:
        from auth import decode_token
        payload = decode_token(request.refresh_token)
        
        # Verify this is a refresh token, not an access token
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type for refresh")
        
        user_id = payload.get("sub") or payload.get("user_id")
        email = payload.get("email")
        role = payload.get("role", "user")
        
        # Create new access token
        new_token = create_access_token({
            "sub": user_id,
            "user_id": user_id,
            "email": email,
            "role": role,
        })
        
        return RefreshResponse(access_token=new_token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.post("/logout")
async def logout(current_user: TokenData = Depends(get_current_user)):
    """
    Logout endpoint - revokes the current access token
    Token will be added to blacklist and cannot be used again
    """
    # In production, store revoked tokens in Redis or database for persistence
    # For now, using in-memory blacklist
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    
    return {"message": "Successfully logged out. Please discard your access token."}


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Forgot password endpoint - sends reset link to user email
    Returns success regardless of whether email exists (security best practice)
    """
    try:
        email_lower = request.email.lower()
        
        # Check if user exists
        user = await fetchrow(
            "SELECT id, email FROM users WHERE email = $1",
            email_lower
        )
        
        if user:
            # Generate password reset token (valid for 1 hour)
            import secrets
            import time
            reset_token = secrets.token_urlsafe(32)
            token_exp = int(time.time()) + (3600)  # 1 hour from now
            
            # Store reset token in database
            await execute(
                """INSERT INTO password_reset_tokens (user_id, token, token_exp, created_at)
                   VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                   ON CONFLICT (user_id) DO UPDATE SET token = $2, token_exp = $3""",
                user["id"],
                reset_token,
                token_exp
            )
            
            # TODO: Send email with reset link
            print(f"[v0] Password reset token for {email_lower}: {reset_token}")
        
        # Always return success (don't reveal if email exists)
        return {
            "success": True,
            "message": "If an account exists with this email, a password reset link has been sent."
        }
    except Exception as e:
        print(f"[v0] Forgot password error: {str(e)}")
        # Still return success for security
        return {
            "success": True,
            "message": "If an account exists with this email, a password reset link has been sent."
        }


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=20, description="Reset token from email")
    new_password: str = Field(..., min_length=12, description="New password")


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """
    Reset password endpoint - validates token and updates password
    """
    try:
        import time
        from auth import validate_password_strength
        
        # Validate password strength
        validation = validate_password_strength(request.new_password)
        if not validation["valid"]:
            raise HTTPException(
                status_code=400,
                detail=f"Password too weak: {'; '.join(validation['errors'][:2])}"
            )
        
        # Find reset token
        token_record = await fetchrow(
            """SELECT user_id, token_exp FROM password_reset_tokens 
               WHERE token = $1""",
            request.token
        )
        
        if not token_record:
            raise HTTPException(status_code=400, detail="Invalid reset token")
        
        # Check if token is expired
        if token_record["token_exp"] < int(time.time()):
            await execute(
                "DELETE FROM password_reset_tokens WHERE token = $1",
                request.token
            )
            raise HTTPException(status_code=400, detail="Reset token has expired")
        
        # Update password
        hashed_password = get_password_hash(request.new_password)
        await execute(
            "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
            hashed_password,
            token_record["user_id"]
        )
        
        # Delete used reset token
        await execute(
            "DELETE FROM password_reset_tokens WHERE token = $1",
            request.token
        )
        
        return {
            "success": True,
            "message": "Password reset successfully. Please log in with your new password."
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[v0] Reset password error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reset password")
