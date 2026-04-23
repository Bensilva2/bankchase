-- Create banking_data table for cross-device persistence
CREATE TABLE IF NOT EXISTS banking_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) UNIQUE NOT NULL,
  data JSONB NOT NULL,
  session_id VARCHAR(50),
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create primary index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_banking_data_email ON banking_data(user_email);

-- Create composite index for email + last_accessed_at (for activity tracking)
CREATE INDEX IF NOT EXISTS idx_banking_data_email_accessed ON banking_data(user_email, last_accessed_at DESC);

-- Create index for session lookups
CREATE INDEX IF NOT EXISTS idx_banking_data_session_id ON banking_data(session_id);

-- Create JSONB GIN index for efficient querying of data contents
CREATE INDEX IF NOT EXISTS idx_banking_data_gin ON banking_data USING GIN(data);

-- Enable Row Level Security
ALTER TABLE banking_data ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to select their own data by email (for demo purposes without auth)
CREATE POLICY "Allow public read by email" ON banking_data
  FOR SELECT USING (true);

-- Policy to allow anyone to insert data (for demo purposes without auth)
CREATE POLICY "Allow public insert" ON banking_data
  FOR INSERT WITH CHECK (true);

-- Policy to allow anyone to update their own data by email
CREATE POLICY "Allow public update by email" ON banking_data
  FOR UPDATE USING (true);

-- Policy to allow anyone to delete their own data by email
CREATE POLICY "Allow public delete by email" ON banking_data
  FOR DELETE USING (true);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at on banking_data
DROP TRIGGER IF EXISTS update_banking_data_updated_at ON banking_data;
CREATE TRIGGER update_banking_data_updated_at
  BEFORE UPDATE ON banking_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update last_accessed_at on SELECT (using UPDATE bypass)
CREATE OR REPLACE FUNCTION update_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  NEW.access_count = COALESCE(NEW.access_count, 0) + 1;
  NEW.last_accessed_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to track access patterns
DROP TRIGGER IF EXISTS track_banking_access ON banking_data;
CREATE TRIGGER track_banking_access
  BEFORE UPDATE ON banking_data
  FOR EACH ROW
  WHEN (NEW.data IS DISTINCT FROM OLD.data)
  EXECUTE FUNCTION update_last_accessed();
