-- Create verification_methods table
CREATE TABLE IF NOT EXISTS verification_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('microdeposit', 'identity_match', 'recovery_codes', 'backup_phone')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'expired')),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Create microdeposits table
CREATE TABLE IF NOT EXISTS microdeposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_session_id uuid NOT NULL,
  deposit_amount_1 DECIMAL(10, 2) NOT NULL,
  deposit_amount_2 DECIMAL(10, 2) NOT NULL,
  confirmed_amount_1 DECIMAL(10, 2),
  confirmed_amount_2 DECIMAL(10, 2),
  attempts_remaining INT DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'expired')),
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT (now() + INTERVAL '7 days'),
  confirmed_at TIMESTAMP
);

-- Create identity_match_rules table
CREATE TABLE IF NOT EXISTS identity_match_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('ssn', 'name', 'dob', 'address', 'phone')),
  fuzzy_match_threshold DECIMAL(3, 2) DEFAULT 0.85,
  is_required BOOLEAN DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create verification_sessions table
CREATE TABLE IF NOT EXISTS verification_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('signup', 'account_recovery', 'security_verification')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'expired')),
  current_step INT DEFAULT 1,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT (now() + INTERVAL '24 hours'),
  completed_at TIMESTAMP
);

-- Create recovery_codes table
CREATE TABLE IF NOT EXISTS recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Create verification_analytics table
CREATE TABLE IF NOT EXISTS verification_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  method_type TEXT,
  session_id uuid,
  status TEXT,
  duration_seconds INT,
  error_reason TEXT,
  timestamp TIMESTAMP DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  FOREIGN KEY (session_id) REFERENCES verification_sessions(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_methods_user_id ON verification_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_methods_status ON verification_methods(status);
CREATE INDEX IF NOT EXISTS idx_microdeposits_user_id ON microdeposits(user_id);
CREATE INDEX IF NOT EXISTS idx_microdeposits_status ON microdeposits(status);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_user_id ON verification_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_status ON verification_sessions(status);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_user_id ON recovery_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_analytics_timestamp ON verification_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_verification_analytics_status ON verification_analytics(status);
