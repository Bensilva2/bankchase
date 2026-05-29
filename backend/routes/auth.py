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
    get_current_user,
)
from models import TokenData
from utils.pin_security import set_user_pin

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
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
    email_lower = request.email.lower()

    # Check if user already exists
    existing_user = await fetchrow(
        "SELECT id FROM users WHERE email = $1",
        email_lower
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
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
        request.first_name,
        request.last_name,
        "user"
    )

    if not new_user:
        raise HTTPException(
            status_code=500,
            detail="Failed to create user account"
        )

    # Set a default PIN for the user
    try:
        # Use last 4 digits of user ID as default PIN
        default_pin = str(user_id)[-4:]
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


@router.post("/logout")
async def logout(current_user: TokenData = Depends(get_current_user)):
    """
    Logout endpoint
    In production, you might invalidate tokens by storing them in a blacklist
    """
    return {"message": "Successfully logged out"}
