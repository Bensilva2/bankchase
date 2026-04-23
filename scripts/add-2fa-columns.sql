-- Add TOTP columns to users table for 2FA support
-- This migration adds the necessary columns to support TOTP-based two-factor authentication

ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_backup_codes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT; -- Base64 encoded profile picture
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create an index for faster lookups on two_factor_enabled
CREATE INDEX IF NOT EXISTS idx_users_2fa_enabled ON users(two_factor_enabled);

-- Add a comment to document the columns
COMMENT ON COLUMN users.totp_secret IS 'Base32-encoded TOTP secret key for authenticator apps';
COMMENT ON COLUMN users.totp_backup_codes IS 'SHA256-hashed backup codes (pipe-separated) for account recovery';
COMMENT ON COLUMN users.two_factor_enabled IS 'Flag indicating if TOTP 2FA is enabled for this user';
COMMENT ON COLUMN users.profile_picture IS 'Base64-encoded user profile picture';
COMMENT ON COLUMN users.first_name IS 'User first name';
COMMENT ON COLUMN users.last_name IS 'User last name';
COMMENT ON COLUMN users.updated_at IS 'Timestamp of last update to user record';
