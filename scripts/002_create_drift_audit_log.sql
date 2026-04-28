-- Drift Audit Log Table
-- Stores drift detection events for trend analysis and security review

CREATE TABLE IF NOT EXISTS public.drift_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL DEFAULT 'default',
  session_id TEXT,
  
  -- Drift detection results
  drift_detected BOOLEAN NOT NULL DEFAULT FALSE,
  drift_score REAL NOT NULL DEFAULT 0.0,
  action_taken TEXT NOT NULL DEFAULT 'normal_update',
  
  -- Confidence metrics
  voice_confidence REAL DEFAULT 0.0,
  liveness_confidence REAL DEFAULT 0.0,
  overall_confidence REAL DEFAULT 0.0,
  
  -- Feature deviations at time of detection
  deviations JSONB DEFAULT '{}'::jsonb,
  
  -- Session behavioral features (snapshot)
  session_features JSONB DEFAULT '{}'::jsonb,
  
  -- Algorithm used for detection
  detection_algorithm TEXT DEFAULT 'ema',
  
  -- Risk assessment
  risk_level TEXT DEFAULT 'low',
  escalated BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  client_ip TEXT,
  user_agent TEXT,
  device_fingerprint TEXT
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_drift_audit_log_user_id 
ON public.drift_audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_drift_audit_log_org_id 
ON public.drift_audit_log(org_id);

CREATE INDEX IF NOT EXISTS idx_drift_audit_log_created_at 
ON public.drift_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_drift_audit_log_drift_detected 
ON public.drift_audit_log(drift_detected);

CREATE INDEX IF NOT EXISTS idx_drift_audit_log_risk_level 
ON public.drift_audit_log(risk_level);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_drift_audit_log_user_created 
ON public.drift_audit_log(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.drift_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only see their own logs
CREATE POLICY "drift_audit_log_select_own" 
ON public.drift_audit_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "drift_audit_log_insert_own" 
ON public.drift_audit_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- No update/delete policies - audit logs should be immutable
