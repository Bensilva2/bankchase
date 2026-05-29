"""
Accounts API Routes
- List user accounts
- Get account details
- Create new account
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from database import fetch, fetchrow, execute
from auth import get_current_user
from models import (
    TokenData,
    AccountCreate,
    AccountResponse,
    AccountsListResponse,
)

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.get("", response_model=AccountsListResponse)
async def list_accounts(
    current_user: TokenData = Depends(get_current_user)
):
    """Get all accounts for the current user"""
    rows = await fetch(
        """
        SELECT id, user_id, account_number, account_type, account_name,
               balance, is_demo_account, created_at
        FROM accounts
        WHERE user_id = $1
        ORDER BY created_at DESC
        """,
        current_user.user_id
    )
    
    accounts = [
        AccountResponse(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            account_number=row["account_number"],
            account_type=row["account_type"],
            account_name=row["account_name"],
            balance=float(row["balance"]),
            is_demo_account=row["is_demo_account"],
            created_at=row["created_at"]
        )
        for row in rows
    ]
    
    total_balance = sum(a.balance for a in accounts)
    
    return AccountsListResponse(accounts=accounts, total_balance=total_balance)


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Get details for a specific account"""
    row = await fetchrow(
        """
        SELECT id, user_id, account_number, account_type, account_name,
               balance, is_demo_account, created_at
        FROM accounts
        WHERE id = $1 AND user_id = $2
        """,
        uuid.UUID(account_id),
        current_user.user_id
    )
    
    if not row:
        raise HTTPException(status_code=404, detail="Account not found")
    
    return AccountResponse(
        id=str(row["id"]),
        user_id=str(row["user_id"]),
        account_number=row["account_number"],
        account_type=row["account_type"],
        account_name=row["account_name"],
        balance=float(row["balance"]),
        is_demo_account=row["is_demo_account"],
        created_at=row["created_at"]
    )


@router.post("", response_model=AccountResponse)
async def create_account(
    request: AccountCreate,
    current_user: TokenData = Depends(get_current_user)
):
    """Create a new account for the current user"""
    # Generate account number
    import random
    account_number = "".join([str(random.randint(0, 9)) for _ in range(12)])
    
    row = await fetchrow(
        """
        INSERT INTO accounts (user_id, org_id, account_number, account_type, account_name, balance, is_demo_account)
        VALUES ($1, $2, $3, $4, $5, $6, false)
        RETURNING id, user_id, account_number, account_type, account_name, balance, is_demo_account, created_at
        """,
        current_user.user_id,
        current_user.org_id,
        account_number,
        request.account_type.value,
        request.account_name or f"{request.account_type.value.title()} Account",
        request.initial_balance
    )
    
    return AccountResponse(
        id=str(row["id"]),
        user_id=str(row["user_id"]),
        account_number=row["account_number"],
        account_type=row["account_type"],
        account_name=row["account_name"],
        balance=float(row["balance"]),
        is_demo_account=row["is_demo_account"],
        created_at=row["created_at"]
    )


@router.get("/{account_id}/balance")
async def get_account_balance(
    account_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Get just the balance for a specific account (for quick polling)"""
    row = await fetchrow(
        """
        SELECT balance FROM accounts
        WHERE id = $1 AND user_id = $2
        """,
        uuid.UUID(account_id),
        current_user.user_id
    )
    
    if not row:
        raise HTTPException(status_code=404, detail="Account not found")
    
    return {"balance": float(row["balance"])}
