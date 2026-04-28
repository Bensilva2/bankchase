"""
Pay & Transfer API Routes
- Send money to another account
- Get available banks
"""
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException

from database import fetch, fetchrow, execute
from auth import get_current_user
from models import (
    TokenData,
    TransferRequest,
    TransferResponse,
    BankInfo,
    BanksListResponse,
)
from utils.validation import is_valid_account_number, is_valid_routing_number

router = APIRouter(prefix="/pay-transfer", tags=["Pay & Transfer"])


@router.get("/banks", response_model=BanksListResponse)
async def get_banks(country_code: str = "US"):
    """Get list of supported banks for transfers"""
    rows = await fetch(
        """
        SELECT code, name, short_name, routing_number, swift_code, country_code
        FROM banks
        WHERE is_active = true AND country_code = $1
        ORDER BY short_name
        """,
        country_code.upper()
    )
    
    banks = [
        BankInfo(
            code=row["code"],
            name=row["name"],
            short_name=row["short_name"],
            routing_number=row["routing_number"],
            swift_code=row["swift_code"],
            country_code=row["country_code"]
        )
        for row in rows
    ]
    
    return BanksListResponse(country=country_code.upper(), banks=banks)


@router.post("/send", response_model=TransferResponse)
async def send_money(
    request: TransferRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Send money to another account"""
    
    # 1. Validate source account belongs to user
    from_account = await fetchrow(
        """
        SELECT id, account_number, balance
        FROM accounts
        WHERE account_number = $1 AND user_id = $2
        """,
        request.from_account_number,
        current_user.user_id
    )
    
    if not from_account:
        raise HTTPException(status_code=404, detail="Source account not found")
    
    if float(from_account["balance"]) < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    is_internal = request.to_bank_code.upper() == "INTERNAL"
    
    # 2. Auto-fill routing/SWIFT from bank table if not provided
    if not is_internal:
        bank = await fetchrow(
            """
            SELECT routing_number, swift_code
            FROM banks
            WHERE code = $1 AND country_code = $2
            """,
            request.to_bank_code,
            request.country_code.upper()
        )
        
        if bank:
            if request.country_code == "US" and not request.to_routing_number:
                request.to_routing_number = bank["routing_number"]
            elif request.country_code != "US" and not request.to_swift_code:
                request.to_swift_code = bank["swift_code"]
    
    # 3. Find or create destination account
    to_account = await fetchrow(
        "SELECT id, user_id FROM accounts WHERE account_number = $1",
        request.to_account_number
    )
    
    if not to_account:
        # Create external account
        to_account = await fetchrow(
            """
            INSERT INTO accounts (account_number, user_id, org_id, balance, is_demo_account, account_type)
            VALUES ($1, NULL, $2, 0.0, true, 'checking')
            RETURNING id, user_id
            """,
            request.to_account_number,
            current_user.org_id
        )
    
    status = "completed" if is_internal else "pending"
    
    # 4. Create debit transaction (from sender)
    debit_tx = await fetchrow(
        """
        INSERT INTO transactions (account_id, user_id, org_id, transaction_type, amount, description, to_account_number, status)
        VALUES ($1, $2, $3, 'debit', $4, $5, $6, $7)
        RETURNING id
        """,
        from_account["id"],
        current_user.user_id,
        current_user.org_id,
        request.amount,
        request.narration or f"Transfer to {request.to_account_number}",
        request.to_account_number,
        status
    )
    
    # 5. Create credit transaction (to receiver)
    credit_tx = await fetchrow(
        """
        INSERT INTO transactions (account_id, user_id, org_id, transaction_type, amount, description, to_account_number, status)
        VALUES ($1, $2, $3, 'credit', $4, $5, NULL, $6)
        RETURNING id
        """,
        to_account["id"],
        to_account["user_id"],
        current_user.org_id,
        request.amount,
        request.narration or "Funds received",
        status
    )
    
    # 6. Update balances
    await execute(
        "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
        request.amount,
        from_account["id"]
    )
    await execute(
        "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
        request.amount,
        to_account["id"]
    )
    
    return TransferResponse(
        status="success",
        message="Transfer completed successfully" if is_internal else "Transfer pending",
        debit_transaction_id=str(debit_tx["id"]),
        credit_transaction_id=str(credit_tx["id"]),
        from_account=request.from_account_number,
        to_account=request.to_account_number,
        amount=request.amount,
        will_refund_in_days=request.days_to_refund if not is_internal else None
    )
