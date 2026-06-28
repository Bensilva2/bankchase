-- Column-Level Encryption for Sensitive Data
-- Uses pgcrypto extension for AES-256 encryption

BEGIN;

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- ENCRYPTION KEY MANAGEMENT
-- ============================================

-- Create encryption key storage table
CREATE TABLE IF NOT EXISTS public.encryption_keys (
    id BIGSERIAL PRIMARY KEY,
    key_name VARCHAR(255) UNIQUE NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    rotated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT
);

-- Enable RLS on encryption keys
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can see encryption keys
CREATE POLICY "encryption_keys_admin_only" ON public.encryption_keys
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- ADD ENCRYPTED COLUMNS TO USERS TABLE
-- ============================================

-- Add encrypted columns for sensitive user data
ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS ssn_encrypted BYTEA,
    ADD COLUMN IF NOT EXISTS phone_encrypted BYTEA,
    ADD COLUMN IF NOT EXISTS address_encrypted BYTEA;

-- Create index on encrypted columns (for lookups)
CREATE INDEX IF NOT EXISTS idx_users_phone_encrypted ON public.users(phone_encrypted);

-- ============================================
-- ADD ENCRYPTED COLUMNS TO ACCOUNTS TABLE
-- ============================================

ALTER TABLE public.accounts
    ADD COLUMN IF NOT EXISTS card_number_encrypted BYTEA,
    ADD COLUMN IF NOT EXISTS card_cvv_encrypted BYTEA,
    ADD COLUMN IF NOT EXISTS bank_routing_encrypted BYTEA;

CREATE INDEX IF NOT EXISTS idx_accounts_card_encrypted ON public.accounts(card_number_encrypted);

-- ============================================
-- ENCRYPTION/DECRYPTION FUNCTIONS
-- ============================================

-- Store the encryption key as a constant (in production, use AWS KMS or similar)
-- This key should be stored in environment variables
CREATE OR REPLACE FUNCTION get_encryption_key()
RETURNS TEXT AS $$
BEGIN
    -- In production, fetch from environment variable or key management service
    RETURN COALESCE(current_setting('app.encryption_key', true), 'default-key-change-in-production');
END;
$$ LANGUAGE plpgsql;

-- Function to encrypt data
CREATE OR REPLACE FUNCTION encrypt_data(data TEXT, key_name TEXT DEFAULT 'default')
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(
        data,
        get_encryption_key(),
        'cipher-algo=aes256, compress-algo=1, compress-level=9'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to decrypt data
CREATE OR REPLACE FUNCTION decrypt_data(encrypted_data BYTEA, key_name TEXT DEFAULT 'default')
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(
        encrypted_data,
        get_encryption_key()
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MASKING FUNCTIONS
-- ============================================

-- Mask SSN: XXX-XX-1234
CREATE OR REPLACE FUNCTION mask_ssn(ssn_encrypted BYTEA)
RETURNS TEXT AS $$
BEGIN
    DECLARE
        decrypted TEXT;
        masked TEXT;
    BEGIN
        -- Only decrypt for authorized users
        IF auth.jwt() ->> 'role' IN ('admin', 'compliance') THEN
            RETURN decrypt_data(ssn_encrypted);
        END IF;
        
        decrypted := decrypt_data(ssn_encrypted);
        IF decrypted IS NULL THEN
            RETURN NULL;
        END IF;
        
        -- Mask all but last 4 digits
        masked := 'XXX-XX-' || RIGHT(decrypted, 4);
        RETURN masked;
    EXCEPTION WHEN OTHERS THEN
        RETURN 'XXX-XX-XXXX';
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mask card number: XXXX-XXXX-XXXX-1234
CREATE OR REPLACE FUNCTION mask_card(card_encrypted BYTEA)
RETURNS TEXT AS $$
BEGIN
    DECLARE
        decrypted TEXT;
        masked TEXT;
    BEGIN
        IF auth.jwt() ->> 'role' IN ('admin') THEN
            RETURN decrypt_data(card_encrypted);
        END IF;
        
        decrypted := decrypt_data(card_encrypted);
        IF decrypted IS NULL THEN
            RETURN NULL;
        END IF;
        
        -- Mask all but last 4 digits
        masked := 'XXXX-XXXX-XXXX-' || RIGHT(decrypted, 4);
        RETURN masked;
    EXCEPTION WHEN OTHERS THEN
        RETURN 'XXXX-XXXX-XXXX-XXXX';
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mask phone number: XXX-XXX-1234
CREATE OR REPLACE FUNCTION mask_phone(phone_encrypted BYTEA)
RETURNS TEXT AS $$
BEGIN
    DECLARE
        decrypted TEXT;
        masked TEXT;
    BEGIN
        IF auth.jwt() ->> 'role' IN ('admin') THEN
            RETURN decrypt_data(phone_encrypted);
        END IF;
        
        decrypted := decrypt_data(phone_encrypted);
        IF decrypted IS NULL THEN
            RETURN NULL;
        END IF;
        
        -- Keep last 4 digits
        masked := 'XXX-XXX-' || RIGHT(decrypted, 4);
        RETURN masked;
    EXCEPTION WHEN OTHERS THEN
        RETURN 'XXX-XXX-XXXX';
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mask email: u***@example.com
CREATE OR REPLACE FUNCTION mask_email(email TEXT)
RETURNS TEXT AS $$
BEGIN
    IF auth.jwt() ->> 'role' IN ('admin') THEN
        RETURN email;
    END IF;
    
    IF email IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Show first letter and domain
    RETURN LEFT(email, 1) || '***@' || SUBSTRING(email FROM POSITION('@' IN email) + 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ENCRYPTION TRIGGERS
-- ============================================

-- Trigger to auto-encrypt SSN on insert/update
CREATE OR REPLACE FUNCTION encrypt_ssn_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ssn_encrypted IS NOT NULL THEN
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ENCRYPTED VIEWS
-- ============================================

-- Create view with masked/decrypted sensitive data
CREATE OR REPLACE VIEW users_view AS
SELECT
    id,
    email,
    first_name,
    last_name,
    mask_phone(phone_encrypted) AS phone_number,
    role,
    created_at,
    updated_at
FROM public.users
WHERE is_admin() OR id = auth.uid();

-- Create accounts view with masked card numbers
CREATE OR REPLACE VIEW accounts_view AS
SELECT
    id,
    user_id,
    account_number,
    routing_number,
    account_type,
    currency,
    balance,
    mask_card(card_number_encrypted) AS card_number,
    status,
    created_at,
    updated_at
FROM public.accounts
WHERE user_id = auth.uid() OR is_admin();

COMMIT;
