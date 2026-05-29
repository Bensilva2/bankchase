"""
Bank transfer validation utilities
- Account number validation
- Routing number validation (US ABA with Mod 10)
- SWIFT code validation
"""
import re


def is_valid_account_number(account_number: str) -> bool:
    """
    Validate bank account number format.
    US accounts: 4-17 digits
    """
    if not account_number:
        return False
    cleaned = account_number.strip()
    return cleaned.isdigit() and 4 <= len(cleaned) <= 17


def is_valid_routing_number(routing_number: str) -> bool:
    """
    Validate US ABA routing number.
    Must be exactly 9 digits and pass Mod 10 checksum.
    """
    if not routing_number:
        return False
    
    cleaned = routing_number.strip()
    
    # Must be exactly 9 digits
    if len(cleaned) != 9 or not cleaned.isdigit():
        return False
    
    # Mod 10 checksum validation
    # Weights: 3, 7, 1, 3, 7, 1, 3, 7, 1
    weights = [3, 7, 1, 3, 7, 1, 3, 7, 1]
    checksum = sum(int(d) * w for d, w in zip(cleaned, weights))
    
    return checksum % 10 == 0


def is_valid_swift_code(swift_code: str) -> bool:
    """
    Validate SWIFT/BIC code format.
    Format: 8 or 11 characters
    - First 4: Bank code (letters)
    - Next 2: Country code (letters)
    - Next 2: Location code (alphanumeric)
    - Optional 3: Branch code (alphanumeric)
    """
    if not swift_code:
        return False
    
    cleaned = swift_code.strip().upper()
    
    # Must be 8 or 11 characters
    if len(cleaned) not in (8, 11):
        return False
    
    # First 4 must be letters (bank code)
    if not cleaned[:4].isalpha():
        return False
    
    # Next 2 must be letters (country code)
    if not cleaned[4:6].isalpha():
        return False
    
    # Next 2 must be alphanumeric (location code)
    if not cleaned[6:8].isalnum():
        return False
    
    # If 11 chars, last 3 must be alphanumeric (branch code)
    if len(cleaned) == 11 and not cleaned[8:11].isalnum():
        return False
    
    return True


def format_account_number(account_number: str) -> str:
    """
    Format account number for display (mask middle digits).
    e.g., "123456789012" -> "****9012"
    """
    if not account_number:
        return ""
    cleaned = account_number.strip()
    if len(cleaned) <= 4:
        return cleaned
    return "****" + cleaned[-4:]


def format_routing_number(routing_number: str) -> str:
    """
    Format routing number for display.
    e.g., "021000021" -> "021-000-021"
    """
    if not routing_number or len(routing_number) != 9:
        return routing_number or ""
    return f"{routing_number[:3]}-{routing_number[3:6]}-{routing_number[6:]}"


def validate_transfer_amount(amount: float, min_amount: float = 0.01, max_amount: float = 100000.0) -> tuple[bool, str]:
    """
    Validate transfer amount within allowed range.
    Returns (is_valid, error_message)
    """
    if amount <= 0:
        return False, "Amount must be positive"
    if amount < min_amount:
        return False, f"Minimum transfer amount is ${min_amount:.2f}"
    if amount > max_amount:
        return False, f"Maximum transfer amount is ${max_amount:,.2f}"
    return True, ""


# Common US bank routing numbers for quick validation
US_BANK_ROUTING_NUMBERS = {
    "021000021": "JPMorgan Chase",
    "026009593": "Bank of America",
    "121000248": "Wells Fargo",
    "021000089": "Citibank",
    "122105278": "U.S. Bank",
    "051405515": "Capital One",
    "043000096": "PNC Bank",
    "061000104": "Truist Bank",
}


def get_bank_name_from_routing(routing_number: str) -> str | None:
    """
    Get bank name from routing number if known.
    """
    return US_BANK_ROUTING_NUMBERS.get(routing_number)
