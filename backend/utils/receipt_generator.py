"""
Receipt generation utilities for creating and storing transaction receipts
"""
from datetime import datetime, timezone
import uuid
import random
import string

from database import fetchrow, execute


def generate_receipt_number() -> str:
    """Generate a unique receipt number"""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    random_suffix = "".join(random.choices(string.digits, k=6))
    return f"RCP-{timestamp}-{random_suffix}"


async def generate_receipt(
    from_account_id: int,
    from_account_number: str,
    to_account_number: str,
    amount: float,
    currency: str = "USD",
    narration: str = None,
    transfer_id: str = None,
    balance_before: float = None,
    balance_after: float = None
) -> dict:
    """
    Generate a receipt object for a transfer
    
    Returns:
        dict with receipt data including receipt_id, date, amount, balances, etc.
    """
    receipt_number = generate_receipt_number()
    now = datetime.now(timezone.utc)
    
    receipt_data = {
        "receipt_id": receipt_number,
        "receipt_number": receipt_number,
        "date": now.isoformat(),
        "time": now.strftime("%H:%M:%S UTC"),
        "from_account": from_account_number,
        "to_account": to_account_number,
        "amount": amount,
        "currency": currency,
        "status": "completed",
        "reference": transfer_id or str(uuid.uuid4()),
        "narration": narration or "Transfer",
        "balance_before": balance_before,
        "balance_after": balance_after,
    }
    
    return receipt_data


async def save_receipt(
    receipt_number: str,
    transfer_id: str,
    from_account_id: int,
    to_account_number: str,
    amount: float,
    currency: str = "USD",
    status: str = "completed",
    balance_before: float = None,
    balance_after: float = None,
    narration: str = None
) -> dict:
    """
    Save receipt to database
    
    Returns:
        dict with saved receipt data including id and timestamp
    """
    result = await fetchrow(
        """INSERT INTO receipts 
           (receipt_number, transfer_id, from_account_id, to_account_number, amount, currency, status, balance_before, balance_after, narration)
           VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10)
           RETURNING id, receipt_number, created_at""",
        receipt_number,
        transfer_id,
        from_account_id,
        to_account_number,
        amount,
        currency,
        status,
        balance_before,
        balance_after,
        narration
    )
    
    return {
        "id": result["id"],
        "receipt_number": result["receipt_number"],
        "created_at": result["created_at"].isoformat()
    }


async def get_receipt(receipt_number: str) -> dict:
    """Retrieve a receipt by receipt number"""
    receipt = await fetchrow(
        "SELECT * FROM receipts WHERE receipt_number = \$1",
        receipt_number
    )
    
    if not receipt:
        return None
    
    return {
        "id": receipt["id"],
        "receipt_number": receipt["receipt_number"],
        "transfer_id": receipt["transfer_id"],
        "from_account_id": receipt["from_account_id"],
        "to_account_number": receipt["to_account_number"],
        "amount": float(receipt["amount"]),
        "currency": receipt["currency"],
        "status": receipt["status"],
        "balance_before": float(receipt["balance_before"]) if receipt["balance_before"] else None,
        "balance_after": float(receipt["balance_after"]) if receipt["balance_after"] else None,
        "narration": receipt["narration"],
        "created_at": receipt["created_at"].isoformat()
    }
