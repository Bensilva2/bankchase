"""
Admin Demo Transfer API Routes
- Get/create admin demo source account
- Send demo money to users
- Bulk demo transfers
- Process refunds
"""
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from database import fetch, fetchrow, execute
from auth import get_current_user, require_role
from models import (
    TokenData,
    DemoTransferRequest,
    BulkDemoTransferRequest,
    TransferResponse,
    BankInfo,
    BanksListResponse,
)
from utils.rate_limiting import limiter

router = APIRouter(prefix="/admin", tags=["Admin - Demo"])

# Initial demo balance for admin accounts
INITIAL_DEMO_BALANCE = 1_000_000.00


async def get_or_create_admin_demo_account(user_id: str, org_id: str) -> dict:
    """Get or create the admin's demo source account"""
    
    # Check for existing demo source account
    account = await fetchrow(
        """
        SELECT id, account_number, balance
        FROM accounts
        WHERE user_id = $1 AND is_demo_account = true AND account_type = 'demo'
        """,
        user_id
    )
    
    if account:
        return dict(account)
    
    # Create new admin demo account
    import random
    account_number = "DEMO" + "".join([str(random.randint(0, 9)) for _ in range(8)])
    
    account = await fetchrow(
        """
        INSERT INTO accounts (user_id, org_id, account_number, account_type, account_name, balance, is_demo_account)
        VALUES ($1, $2, $3, 'demo', 'Admin Demo Source', $4, true)
        RETURNING id, account_number, balance
        """,
        user_id,
        org_id,
        account_number,
        INITIAL_DEMO_BALANCE
    )
    
    return dict(account)


@router.get("/demo/account")
async def get_admin_demo_account(
    current_admin: TokenData = Depends(require_role(["admin", "owner", "SuperAdmin", "OrgAdmin"]))
):
    """Get admin's demo source account balance"""
    account = await get_or_create_admin_demo_account(
        current_admin.user_id,
        current_admin.org_id
    )
    
    return {
        "account_number": account["account_number"],
        "balance": float(account["balance"]),
        "initial_balance": INITIAL_DEMO_BALANCE
    }


@router.post("/demo/transfer", response_model=TransferResponse)
@limiter.limit("20/minute")
async def admin_demo_transfer(
    request: DemoTransferRequest,
    current_admin: TokenData = Depends(require_role(["admin", "owner", "SuperAdmin", "OrgAdmin"]))
):
    """Send demo money to an account with rate limiting"""
    
    admin_account = await get_or_create_admin_demo_account(
        current_admin.user_id,
        current_admin.org_id
    )
    
    if float(admin_account["balance"]) < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient demo balance")
    
    is_internal = request.to_bank_code.upper() == "INTERNAL"
    
    # Auto-fill routing/SWIFT from bank table
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
    
    # Find or create destination account
    to_account = await fetchrow(
        "SELECT id, user_id FROM accounts WHERE account_number = $1",
        request.to_account_number
    )
    
    if not to_account:
        to_account = await fetchrow(
            """
            INSERT INTO accounts (account_number, user_id, org_id, balance, is_demo_account, account_type)
            VALUES ($1, NULL, $2, 0.0, true, 'checking')
            RETURNING id, user_id
            """,
            request.to_account_number,
            current_admin.org_id
        )
    
    # Create transfer record
    expires_at = None if is_internal else datetime.now(timezone.utc) + timedelta(days=request.days_to_refund)
    status = "completed" if is_internal else "pending"
    
    transfer = await fetchrow(
        """
        INSERT INTO demo_transfers (admin_user_id, from_account_id, to_account_number, amount, status, transfer_type, expires_at, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, transfer_id
        """,
        current_admin.user_id,
        admin_account["id"],
        request.to_account_number,
        request.amount,
        status,
        "internal" if is_internal else "external",
        expires_at,
        f"Bank: {request.to_bank_code} | Country: {request.country_code}"
    )
    
    # Update balances
    await execute(
        "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
        request.amount,
        admin_account["id"]
    )
    await execute(
        "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
        request.amount,
        to_account["id"]
    )
    
    return TransferResponse(
        status="success",
        message="Demo transfer completed" if is_internal else "Demo transfer pending",
        transfer_id=str(transfer["transfer_id"]),
        from_account=admin_account["account_number"],
        to_account=request.to_account_number,
        amount=request.amount,
        will_refund_in_days=request.days_to_refund if not is_internal else None
    )


@router.post("/demo/bulk-transfer")
async def bulk_demo_transfer(
    request: BulkDemoTransferRequest,
    current_admin: TokenData = Depends(require_role(["admin", "owner", "SuperAdmin", "OrgAdmin"]))
):
    """Send demo money to all users in the organization"""
    
    admin_account = await get_or_create_admin_demo_account(
        current_admin.user_id,
        current_admin.org_id
    )
    
    # Get all user accounts in the org (excluding the admin's demo account)
    user_accounts = await fetch(
        """
        SELECT id, account_number, user_id
        FROM accounts
        WHERE org_id = $1 AND user_id IS NOT NULL AND id != $2
        """,
        current_admin.org_id,
        admin_account["id"]
    )
    
    if not user_accounts:
        raise HTTPException(status_code=404, detail="No user accounts found in organization")
    
    total_amount = request.amount * len(user_accounts)
    
    if float(admin_account["balance"]) < total_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient demo balance. Need ${total_amount:,.2f} for {len(user_accounts)} accounts"
        )
    
    # Process bulk transfers
    successful = 0
    expires_at = datetime.now(timezone.utc) + timedelta(days=request.days_to_refund)
    
    for account in user_accounts:
        await execute(
            """
            INSERT INTO demo_transfers (admin_user_id, from_account_id, to_account_number, amount, status, transfer_type, expires_at, notes)
            VALUES ($1, $2, $3, $4, 'completed', 'internal', $5, $6)
            """,
            current_admin.user_id,
            admin_account["id"],
            account["account_number"],
            request.amount,
            expires_at,
            request.note or "Bulk demo transfer"
        )
        
        await execute(
            "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
            request.amount,
            account["id"]
        )
        
        successful += 1
    
    # Deduct total from admin account
    await execute(
        "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
        total_amount,
        admin_account["id"]
    )
    
    return {
        "status": "success",
        "message": f"Sent ${request.amount:,.2f} to {successful} accounts",
        "total_sent": total_amount,
        "accounts_credited": successful,
        "will_refund_in_days": request.days_to_refund
    }


@router.get("/demo/history")
async def demo_transfer_history(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = None,
    current_admin: TokenData = Depends(require_role(["admin", "owner", "SuperAdmin", "OrgAdmin"]))
):
    """Get demo transfer history"""
    
    if status:
        rows = await fetch(
            """
            SELECT id, transfer_id, to_account_number, amount, status, transfer_type, expires_at, notes, created_at
            FROM demo_transfers
            WHERE admin_user_id = $1 AND status = $2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
            """,
            current_admin.user_id,
            status,
            limit,
            offset
        )
    else:
        rows = await fetch(
            """
            SELECT id, transfer_id, to_account_number, amount, status, transfer_type, expires_at, notes, created_at
            FROM demo_transfers
            WHERE admin_user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            """,
            current_admin.user_id,
            limit,
            offset
        )
    
    transfers = [
        {
            "id": str(row["id"]),
            "transfer_id": row["transfer_id"],
            "to_account": row["to_account_number"],
            "amount": float(row["amount"]),
            "status": row["status"],
            "type": row["transfer_type"],
            "expires_at": row["expires_at"].isoformat() if row["expires_at"] else None,
            "notes": row["notes"],
            "created_at": row["created_at"].isoformat()
        }
        for row in rows
    ]
    
    return {
        "transfers": transfers,
        "count": len(transfers),
        "limit": limit,
        "offset": offset
    }


@router.post("/demo/process-refunds")
async def process_demo_refunds(
    current_admin: TokenData = Depends(require_role(["admin", "owner", "SuperAdmin", "OrgAdmin"]))
):
    """Process expired demo transfers and refund them"""
    
    admin_account = await get_or_create_admin_demo_account(
        current_admin.user_id,
        current_admin.org_id
    )
    
    # Find expired pending transfers
    expired = await fetch(
        """
        SELECT dt.id, dt.to_account_number, dt.amount, a.id as to_account_id
        FROM demo_transfers dt
        LEFT JOIN accounts a ON a.account_number = dt.to_account_number
        WHERE dt.admin_user_id = $1
          AND dt.status = 'pending'
          AND dt.expires_at < NOW()
        """,
        current_admin.user_id
    )
    
    refunded = 0
    total_refunded = 0.0
    
    for transfer in expired:
        # Deduct from recipient account
        await execute(
            "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
            float(transfer["amount"]),
            transfer["to_account_id"]
        )
        
        # Credit back to admin account
        await execute(
            "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
            float(transfer["amount"]),
            admin_account["id"]
        )
        
        # Mark transfer as refunded
        await execute(
            "UPDATE demo_transfers SET status = 'refunded', refunded_at = NOW() WHERE id = $1",
            transfer["id"]
        )
        
        refunded += 1
        total_refunded += float(transfer["amount"])
    
    return {
        "status": "success",
        "refunded_count": refunded,
        "total_refunded": total_refunded
    }


@router.get("/banks", response_model=BanksListResponse)
async def get_banks(country_code: str = "US"):
    """Get list of banks for transfer dropdown"""
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
