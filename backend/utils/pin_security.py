"""
PIN security utilities for validating and storing user PINs
Includes hashing, validation, and attempt tracking
"""
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
import re

from database import fetchrow, execute, fetch


# Password context for bcrypt hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# PIN security constants
PIN_LOCKOUT_DURATION = 15  # minutes
MAX_PIN_ATTEMPTS = 3


def hash_pin(pin: str) -> str:
    """Hash a PIN using bcrypt"""
    return pwd_context.hash(pin)


def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    """Verify a plain PIN against its hash"""
    return pwd_context.verify(plain_pin, hashed_pin)


async def validate_pin_format(pin: str) -> bool:
    """Validate PIN format (4-6 digits, not sequential, not all same)"""
    # Check if 4-6 digits
    if not re.match(r"^\d{4,6}$", pin):
        return False
    
    # Check if all same digits (1111 invalid)
    if len(set(pin)) == 1:
        return False
    
    # Check if sequential (1234 invalid)
    if pin in ["0123", "1234", "2345", "3456", "4567", "5678", "6789",
               "9876", "8765", "7654", "6543", "5432", "4321", "3210"]:
        return False
    
    return True


async def check_pin_locked(user_id: str) -> bool:
    """Check if user's PIN is locked due to too many failed attempts"""
    user_pin = await fetchrow(
        "SELECT locked_until FROM user_pins WHERE user_id = \$1",
        user_id
    )
    
    if not user_pin:
        return False
    
    if user_pin["locked_until"] is None:
        return False
    
    # Check if lockout has expired
    now = datetime.now(timezone.utc)
    return user_pin["locked_until"] > now


async def get_pin_attempts(user_id: str) -> int:
    """Get current failed PIN attempt count"""
    user_pin = await fetchrow(
        "SELECT attempts FROM user_pins WHERE user_id = \$1",
        user_id
    )
    return user_pin["attempts"] if user_pin else 0


async def validate_pin(user_id: str, provided_pin: str) -> dict:
    """
    Validate user's PIN against stored hash
    Returns: {'valid': bool, 'message': str, 'locked': bool}
    """
    # Check PIN format
    is_valid_format = await validate_pin_format(provided_pin)
    if not is_valid_format:
        raise HTTPException(status_code=400, detail="Invalid PIN format (4-6 digits required)")
    
    # Check if user is locked out
    is_locked = await check_pin_locked(user_id)
    if is_locked:
        user_pin = await fetchrow(
            "SELECT locked_until FROM user_pins WHERE user_id = \$1",
            user_id
        )
        raise HTTPException(
            status_code=429,
            detail=f"Too many failed PIN attempts. Account locked until {user_pin['locked_until'].isoformat()}"
        )
    
    # Get stored PIN hash
    user_pin = await fetchrow(
        "SELECT pin_hash FROM user_pins WHERE user_id = \$1",
        user_id
    )
    
    if not user_pin:
        raise HTTPException(status_code=404, detail="PIN not set for user. Please set PIN first.")
    
    # Verify PIN
    pin_matches = verify_pin(provided_pin, user_pin["pin_hash"])
    
    if not pin_matches:
        # Increment failed attempt counter
        new_attempts = await get_pin_attempts(user_id) + 1
        
        locked_until = None
        if new_attempts >= MAX_PIN_ATTEMPTS:
            # Lock account for PIN_LOCKOUT_DURATION minutes
            locked_until = datetime.now(timezone.utc) + timedelta(minutes=PIN_LOCKOUT_DURATION)
        
        await execute(
            """UPDATE user_pins SET attempts = \$1, locked_until = \$2, updated_at = CURRENT_TIMESTAMP
               WHERE user_id = \$3""",
            new_attempts,
            locked_until,
            user_id
        )
        
        # Log failed attempt
        await execute(
            "INSERT INTO pin_attempt_log (user_id, status) VALUES (\$1, 'failed')",
            user_id
        )
        
        remaining = MAX_PIN_ATTEMPTS - new_attempts
        raise HTTPException(
            status_code=401,
            detail=f"Invalid PIN. {remaining} attempts remaining before lockout."
        )
    
    # PIN is valid - reset attempts
    await execute(
        """UPDATE user_pins SET attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = \$1""",
        user_id
    )
    
    # Log successful attempt
    await execute(
        "INSERT INTO pin_attempt_log (user_id, status) VALUES (\$1, 'success')",
        user_id
    )
    
    return {"valid": True, "message": "PIN verified successfully"}


async def set_user_pin(user_id: str, pin: str) -> dict:
    """Set or update a user's PIN"""
    # Validate format
    is_valid = await validate_pin_format(pin)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid PIN format (4-6 digits required)")
    
    # Hash the PIN
    hashed = hash_pin(pin)
    
    # Insert or update PIN
    result = await fetchrow(
        """INSERT INTO user_pins (user_id, pin_hash, attempts, locked_until)
           VALUES (\$1, \$2, 0, NULL)
           ON CONFLICT (user_id) DO UPDATE
           SET pin_hash = \$2, attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
           RETURNING user_id""",
        user_id,
        hashed
    )
    
    return {"success": True, "message": "PIN set successfully"}
