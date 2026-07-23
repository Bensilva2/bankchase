"""
Data masking utilities for hiding sensitive information
"""

import re
import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class DataMasking:
    """Handle dynamic data masking based on user role"""

    SENSITIVE_FIELDS = {
        'ssn',
        'social_security_number',
        'card_number',
        'card_cvv',
        'cvv',
        'phone',
        'phone_number',
        'email',
        'password',
        'password_hash',
        'bank_account',
        'routing_number',
        'drivers_license',
        'date_of_birth',
        'address',
    }

    @staticmethod
    def mask_ssn(ssn: Optional[str], full_access: bool = False) -> str:
        """
        Mask SSN to XXX-XX-1234

        Args:
            ssn: Social Security Number
            full_access: If True, return unmasked (for authorized users)

        Returns:
            Masked or original SSN
        """
        if not ssn or full_access:
            return ssn or ""

        # Remove any non-digits
        clean_ssn = re.sub(r'\D', '', ssn)

        if len(clean_ssn) < 4:
            return "XXX-XX-XXXX"

        last_four = clean_ssn[-4:]
        return f"XXX-XX-{last_four}"

    @staticmethod
    def mask_card(card: Optional[str], full_access: bool = False) -> str:
        """
        Mask card number to XXXX-XXXX-XXXX-1234

        Args:
            card: Card number
            full_access: If True, return unmasked

        Returns:
            Masked or original card number
        """
        if not card or full_access:
            return card or ""

        # Remove any non-digits
        clean_card = re.sub(r'\D', '', card)

        if len(clean_card) < 4:
            return "XXXX-XXXX-XXXX-XXXX"

        last_four = clean_card[-4:]
        return f"XXXX-XXXX-XXXX-{last_four}"

    @staticmethod
    def mask_phone(phone: Optional[str], full_access: bool = False) -> str:
        """
        Mask phone number to XXX-XXX-1234

        Args:
            phone: Phone number
            full_access: If True, return unmasked

        Returns:
            Masked or original phone number
        """
        if not phone or full_access:
            return phone or ""

        # Remove any non-digits
        clean_phone = re.sub(r'\D', '', phone)

        if len(clean_phone) < 4:
            return "XXX-XXX-XXXX"

        last_four = clean_phone[-4:]
        return f"XXX-XXX-{last_four}"

    @staticmethod
    def mask_email(email: Optional[str], full_access: bool = False) -> str:
        """
        Mask email to u***@example.com

        Args:
            email: Email address
            full_access: If True, return unmasked

        Returns:
            Masked or original email
        """
        if not email or full_access:
            return email or ""

        parts = email.split('@')
        if len(parts) != 2:
            return "***@***.***"

        local, domain = parts
        if len(local) < 2:
            return f"{local[0]}***@{domain}"

        return f"{local[0]}***@{domain}"

    @staticmethod
    def mask_address(address: Optional[str], full_access: bool = False) -> str:
        """
        Mask address - show city and state only

        Args:
            address: Full address
            full_access: If True, return unmasked

        Returns:
            Masked or original address
        """
        if not address or full_access:
            return address or ""

        # Very basic masking - show last part (city/state)
        parts = address.split(',')
        if len(parts) > 1:
            return ', '.join(parts[-2:])

        return "***"

    @staticmethod
    def mask_by_field(field_name: str, value: Any, full_access: bool = False) -> Any:
        """
        Auto-mask based on field name

        Args:
            field_name: Name of the field
            value: Field value
            full_access: If True, return unmasked

        Returns:
            Masked or original value
        """
        field_lower = field_name.lower()

        if full_access or value is None:
            return value

        if 'ssn' in field_lower:
            return DataMasking.mask_ssn(str(value) if value else None, full_access)

        if 'card' in field_lower and 'number' in field_lower:
            return DataMasking.mask_card(str(value) if value else None, full_access)

        if 'phone' in field_lower:
            return DataMasking.mask_phone(str(value) if value else None, full_access)

        if 'email' in field_lower:
            return DataMasking.mask_email(str(value) if value else None, full_access)

        if 'address' in field_lower:
            return DataMasking.mask_address(str(value) if value else None, full_access)

        if 'cvv' in field_lower or 'cvc' in field_lower:
            return "***" if value else None

        return value

    @staticmethod
    def mask_dict(
        data: Dict[str, Any], full_access: bool = False, fields_to_mask: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Mask sensitive fields in a dictionary

        Args:
            data: Dictionary to mask
            full_access: If True, return unmasked
            fields_to_mask: List of specific fields to mask (if None, auto-detect)

        Returns:
            Dictionary with masked values
        """
        masked = data.copy()

        for key, value in masked.items():
            # If specific fields provided, only mask those
            if fields_to_mask and key not in fields_to_mask:
                continue

            # Check if field should be masked
            if key.lower() in DataMasking.SENSITIVE_FIELDS or key.lower() in [
                f.lower() for f in (fields_to_mask or [])
            ]:
                masked[key] = DataMasking.mask_by_field(key, value, full_access)

        return masked

    @staticmethod
    def mask_list(
        data_list: list, full_access: bool = False, fields_to_mask: Optional[list] = None
    ) -> list:
        """
        Mask sensitive fields in a list of dictionaries

        Args:
            data_list: List of dictionaries
            full_access: If True, return unmasked
            fields_to_mask: List of fields to mask

        Returns:
            List with masked values
        """
        return [
            DataMasking.mask_dict(item, full_access, fields_to_mask)
            if isinstance(item, dict)
            else item
            for item in data_list
        ]

    @staticmethod
    def should_mask(user_role: Optional[str]) -> bool:
        """
        Determine if data should be masked based on user role

        Args:
            user_role: User's role (customer, admin, auditor, compliance)

        Returns:
            True if data should be masked
        """
        # Admin and compliance users see all data unmasked
        return user_role not in ['admin', 'compliance']

    @staticmethod
    def get_full_access(user_role: Optional[str]) -> bool:
        """
        Determine if user has full access to sensitive data

        Args:
            user_role: User's role

        Returns:
            True if user can see all data
        """
        return user_role in ['admin', 'compliance']


# Convenience function
def mask_sensitive_data(
    data: Dict[str, Any], user_role: Optional[str] = None
) -> Dict[str, Any]:
    """
    Shorthand for masking data based on user role

    Args:
        data: Data to mask
        user_role: User's role

    Returns:
        Masked data
    """
    full_access = DataMasking.get_full_access(user_role)
    return DataMasking.mask_dict(data, full_access)
