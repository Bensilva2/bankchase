-- Migration: Add enhanced 2FA support columns
-- This migration adds new columns to support advanced 2FA features like device management and cross-device sync

-- Add device management columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS totp_secret TEXT,
ADD COLUMN IF NOT EXISTS profile_picture TEXT,
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS device_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP DEFAULT now(),
ADD COLUMN IF NOT EXISTS login_alerts_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS session_timeout INT DEFAULT 30,
ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS totp_devices JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS last_totp_sync TIMESTAMP DEFAULT now(),
ADD COLUMN IF NOT EXISTS totp_backup_codes_count INT DEFAULT 0;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_two_factor_enabled ON users(two_factor_enabled);
CREATE INDEX IF NOT EXISTS idx_users_email_2fa ON users(email) WHERE two_factor_enabled = true;

-- Add update timestamp triggers if they don't exist
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

-- Create 2FA audit log table for tracking changes
CREATE TABLE IF NOT EXISTS two_factor_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'enable', 'disable', 'backup_code_used', 'device_added', 'device_removed'
  device_id VARCHAR(255),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_2fa_audit_user_id ON two_factor_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_audit_created_at ON two_factor_audit_log(created_at DESC);

-- Ensure profile picture column exists
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Create function to handle 2FA status changes
CREATE OR REPLACE FUNCTION handle_2fa_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.two_factor_enabled != OLD.two_factor_enabled THEN
    INSERT INTO two_factor_audit_log (user_id, action, details)
    VALUES (
      NEW.id,
      CASE WHEN NEW.two_factor_enabled THEN 'enable' ELSE 'disable' END,
      jsonb_build_object('timestamp', NOW(), 'previous_state', OLD.two_factor_enabled)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_2fa_status_change ON users;

CREATE TRIGGER on_2fa_status_change
AFTER UPDATE OF two_factor_enabled ON users
FOR EACH ROW
EXECUTE FUNCTION handle_2fa_status_change();

-- Create devices table for tracking active devices
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  device_type VARCHAR(50),
  os_name VARCHAR(100),
  browser_name VARCHAR(100),
  ip_address VARCHAR(50),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Create 2FA sync events table
CREATE TABLE IF NOT EXISTS totp_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_device_id VARCHAR(255),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create login history table
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  ip VARCHAR(50),
  user_agent TEXT,
  device_name VARCHAR(255),
  location_data JSONB DEFAULT '{}',
  two_factor_verified BOOLEAN DEFAULT FALSE,
  login_success BOOLEAN DEFAULT TRUE,
  suspicious_flags TEXT[] DEFAULT '{}',
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create security events table
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  description TEXT,
  ip_address VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_last_active ON user_devices(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_totp_sync_user_id ON totp_sync_events(user_id);
CREATE INDEX IF NOT EXISTS idx_totp_sync_created ON totp_sync_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_timestamp ON login_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at DESC);

-- Add backup codes count view for security monitoring
CREATE OR REPLACE VIEW user_2fa_status AS
SELECT
  u.id,
  u.email,
  u.two_factor_enabled,
  COALESCE(u.totp_backup_codes_count, 0) AS backup_codes_count,
  COALESCE(JSONB_ARRAY_LENGTH(u.totp_devices), 0) AS device_count,
  u.updated_at,
  u.last_totp_sync
FROM users u;
