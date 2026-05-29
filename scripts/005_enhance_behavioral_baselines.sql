-- Enhanced Behavioral Baselines Schema
-- Adds consecutive_drift_count, recent_drift_score, and rolling risk tracking

-- Add new columns to behavioral_baselines table
ALTER TABLE public.behavioral_baselines 
ADD COLUMN IF NOT EXISTS consecutive_drift_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS recent_drift_score REAL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS rolling_risk_multiplier REAL DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS last_successful_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS adaptive_alpha BOOLEAN DEFAULT FALSE;

-- Create index for monitoring consecutive drifts
CREATE INDEX IF NOT EXISTS idx_behavioral_baselines_consecutive_drift 
ON public.behavioral_baselines(consecutive_drift_count DESC, user_id);

-- Create index for rolling risk tracking
CREATE INDEX IF NOT EXISTS idx_behavioral_baselines_rolling_risk 
ON public.behavioral_baselines(rolling_risk_multiplier DESC);
