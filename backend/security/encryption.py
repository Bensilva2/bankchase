"""
Encryption utilities for sensitive data
Uses cryptography library for AES-256 encryption
"""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class EncryptionManager:
    """Handle encryption and decryption of sensitive data"""

    def __init__(self):
        """Initialize encryption manager"""
        try:
            from cryptography.fernet import Fernet
        except ImportError:
            raise ImportError(
                "cryptography package is required. Install with: pip install cryptography"
            )

        self.Fernet = Fernet
        self._cipher = None

    def _get_cipher(self) -> 'Fernet':
        """Get or create encryption cipher"""
        if self._cipher is None:
            # Get encryption key from environment
            key = os.getenv('ENCRYPTION_KEY')

            if not key:
                # Generate a new key for development (NEVER use in production)
                logger.warning(
                    "ENCRYPTION_KEY not set. Generating development key. "
                    "Set ENCRYPTION_KEY env var in production!"
                )
                key = self.Fernet.generate_key()

            # Ensure key is bytes
            if isinstance(key, str):
                key = key.encode()

            self._cipher = self.Fernet(key)

        return self._cipher

    def encrypt(self, plaintext: str) -> Optional[str]:
        """
        Encrypt plaintext using AES-256

        Args:
            plaintext: Text to encrypt

        Returns:
            Base64 encoded encrypted text
        """
        try:
            if not plaintext:
                return None

            cipher = self._get_cipher()
            encrypted = cipher.encrypt(plaintext.encode())
            return encrypted.decode()

        except Exception as e:
            logger.error(f"Encryption failed: {str(e)}")
            return None

    def decrypt(self, encrypted_text: str) -> Optional[str]:
        """
        Decrypt encrypted text

        Args:
            encrypted_text: Encrypted text to decrypt

        Returns:
            Decrypted plaintext
        """
        try:
            if not encrypted_text:
                return None

            cipher = self._get_cipher()
            decrypted = cipher.decrypt(encrypted_text.encode())
            return decrypted.decode()

        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            return None

    def hash_password(self, password: str) -> Optional[str]:
        """
        Hash a password using bcrypt

        Args:
            password: Password to hash

        Returns:
            Hashed password
        """
        try:
            import bcrypt
        except ImportError:
            raise ImportError(
                "bcrypt package is required. Install with: pip install bcrypt"
            )

        try:
            salt = bcrypt.gensalt(rounds=12)
            hashed = bcrypt.hashpw(password.encode(), salt)
            return hashed.decode()

        except Exception as e:
            logger.error(f"Password hashing failed: {str(e)}")
            return None

    def verify_password(self, password: str, hashed: str) -> bool:
        """
        Verify a password against its hash

        Args:
            password: Password to verify
            hashed: Hashed password to compare against

        Returns:
            True if password matches hash
        """
        try:
            import bcrypt
        except ImportError:
            raise ImportError(
                "bcrypt package is required. Install with: pip install bcrypt"
            )

        try:
            return bcrypt.checkpw(password.encode(), hashed.encode())

        except Exception as e:
            logger.error(f"Password verification failed: {str(e)}")
            return False

    @staticmethod
    def generate_encryption_key() -> str:
        """
        Generate a new encryption key for use as ENCRYPTION_KEY env var

        Returns:
            Base64 encoded encryption key
        """
        try:
            from cryptography.fernet import Fernet
        except ImportError:
            raise ImportError(
                "cryptography package is required. Install with: pip install cryptography"
            )

        key = Fernet.generate_key()
        return key.decode()


# Global encryption manager instance
_encryption_manager = None


def get_encryption_manager() -> EncryptionManager:
    """Get global encryption manager instance"""
    global _encryption_manager

    if _encryption_manager is None:
        _encryption_manager = EncryptionManager()

    return _encryption_manager


# Convenience functions
def encrypt_value(plaintext: str) -> Optional[str]:
    """Encrypt a value"""
    manager = get_encryption_manager()
    return manager.encrypt(plaintext)


def decrypt_value(encrypted_text: str) -> Optional[str]:
    """Decrypt a value"""
    manager = get_encryption_manager()
    return manager.decrypt(encrypted_text)


def hash_password(password: str) -> Optional[str]:
    """Hash a password"""
    manager = get_encryption_manager()
    return manager.hash_password(password)


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password"""
    manager = get_encryption_manager()
    return manager.verify_password(password, hashed)


def generate_encryption_key() -> str:
    """Generate a new encryption key"""
    return EncryptionManager.generate_encryption_key()
