-- Behavioral Baselines Table for Voice Drift Detection
-- Stores per-user behavioral patterns for voice biometrics

-- Create behavioral_baselines table in public schema
CREATE TABLE IF NOT EXISTS public.behavioral_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL DEFAULT 'default',
  
  -- Voice behavioral signals (EMA smoothed values)
  avg_pause_duration REAL DEFAULT 0.5,
  pitch_variation REAL DEFAULT 0.15,
  response_latency_mean REAL DEFAULT 1.2,
  tempo_wpm REAL DEFAULT 150.0,
  disfluency_rate REAL DEFAULT 0.05,
  
  -- Confidence and sample tracking
  sample_count INTEGER DEFAULT 0,
  confidence_score REAL DEFAULT 0.5,
  
  -- EMA parameters
  update_alpha REAL DEFAULT 0.1,
  
  -- Drift detection state
  drift_score REAL DEFAULT 0.0,
  last_drift_action TEXT DEFAULT 'enroll',
  
  -- Store recent deviations for trend analysis (JSONB array)
  recent_deviations JSONB DEFAULT '[]'::jsonb,
  
  -- CUSUM parameters for statistical process control
  cusum_positive REAL DEFAULT 0.0,
  cusum_negative REAL DEFAULT 0.0,
  cusum_threshold REAL DEFAULT 5.0,
  
  -- Feature vector for distance-based detection (array of floats)
  feature_vector REAL[] DEFAULT ARRAY[0.5, 0.15, 1.2, 150.0, 0.05]::REAL[],
  
  -- Baseline metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_session_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  baseline_version INTEGER DEFAULT 1
);

-- Create unique constraint on user_id + org_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_behavioral_baselines_user_org 
ON public.behavioral_baselines(user_id, org_id);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_behavioral_baselines_user_id 
ON public.behavioral_baselines(user_id);

CREATE INDEX IF NOT EXISTS idx_behavioral_baselines_org_id 
ON public.behavioral_baselines(org_id);

-- Create index for drift detection queries
CREATE INDEX IF NOT EXISTS idx_behavioral_baselines_drift_score 
ON public.behavioral_baselines(drift_score);

-- Enable Row Level Security
ALTER TABLE public.behavioral_baselines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "behavioral_baselines_select_own" 
ON public.behavioral_baselines 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "behavioral_baselines_insert_own" 
ON public.behavioral_baselines 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "behavioral_baselines_update_own" 
ON public.behavioral_baselines 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "behavioral_baselines_delete_own" 
ON public.behavioral_baselines 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_behavioral_baseline_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS behavioral_baselines_updated_at ON public.behavioral_baselines;
CREATE TRIGGER behavioral_baselines_updated_at
  BEFORE UPDATE ON public.behavioral_baselines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_behavioral_baseline_timestamp();
