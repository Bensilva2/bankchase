-- Create goals table for financial planning
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT DEFAULT 'Savings',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY IF NOT EXISTS "goals_select_own" ON public.goals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "goals_insert_own" ON public.goals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "goals_update_own" ON public.goals FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "goals_delete_own" ON public.goals FOR DELETE USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON public.goals(deadline);
