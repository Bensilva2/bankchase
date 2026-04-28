"""
Transactions API Routes
- Transaction history
- Transaction details
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from database import fetch, fetchrow, fetchval
from auth import get_current_user
from models import (
    TokenData,
    TransactionResponse,
    TransactionHistoryResponse,
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("/history", response_model=TransactionHistoryResponse)
async def transaction_history(
    account_id: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: TokenData = Depends(get_current_user)
):
    """Get transaction history for the current user"""
    
    # Build query based on whether account_id is provided
    if account_id:
        # Verify account belongs to user
        account = await fetchrow(
            "SELECT id FROM accounts WHERE id = $1 AND user_id = $2",
            uuid.UUID(account_id),
            current_user.user_id
        )
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        rows = await fetch(
            """
            SELECT id, account_id, transaction_type, amount, description,
                   to_account_number, status, created_at
            FROM transactions
            WHERE account_id = $1 AND user_id = $2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
            """,
            uuid.UUID(account_id),
            current_user.user_id,
            limit,
            offset
        )
    else:
        rows = await fetch(
            """
            SELECT id, account_id, transaction_type, amount, description,
                   to_account_number, status, created_at
            FROM transactions
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            """,
            current_user.user_id,
            limit,
            offset
        )
    
    transactions = [
        TransactionResponse(
            id=str(row["id"]),
            account_id=str(row["account_id"]),
            type=row["transaction_type"],
            amount=float(row["amount"]),
            description=row["description"],
            to_account=row["to_account_number"],
            status=row["status"],
            date=row["created_at"]
        )
        for row in rows
    ]
    
    return TransactionHistoryResponse(
        transactions=transactions,
        total_count=len(transactions),
        limit=limit,
        offset=offset
    )


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Get details for a specific transaction"""
    row = await fetchrow(
        """
        SELECT id, account_id, transaction_type, amount, description,
               to_account_number, status, created_at
        FROM transactions
        WHERE id = $1 AND user_id = $2
        """,
        uuid.UUID(transaction_id),
        current_user.user_id
    )
    
    if not row:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return TransactionResponse(
        id=str(row["id"]),
        account_id=str(row["account_id"]),
        type=row["transaction_type"],
        amount=float(row["amount"]),
        description=row["description"],
        to_account=row["to_account_number"],
        status=row["status"],
        date=row["created_at"]
    )
