-- Auth0 Integration Migration
-- Add columns to users table for Auth0 support

-- Add Auth0 ID column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth0_id TEXT UNIQUE;

-- Add email verified flag
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Add Auth0 metadata storage
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add app metadata
ALTER TABLE users ADD COLUMN IF NOT EXISTS app_metadata JSONB DEFAULT '{}'::jsonb;

-- Add picture/avatar URL
ALTER TABLE users ADD COLUMN IF NOT EXISTS picture TEXT;

-- Add last login tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Add login count
ALTER TABLE users ADD COLUMN IF NOT EXISTS logins_count INTEGER DEFAULT 0;

-- MCP Token columns for OAuth flow
ALTER TABLE users ADD COLUMN IF NOT EXISTS mcp_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mcp_token_expires_at TIMESTAMP;

-- Create OTP codes table
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  attempt_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  CONSTRAINT otp_email_fk FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_auth0_id ON users(auth0_id);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Create function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run cleanup periodically (optional, requires pg_cron extension)
-- SELECT cron.schedule('cleanup_otps', '*/5 * * * *', 'SELECT cleanup_expired_otps()');
