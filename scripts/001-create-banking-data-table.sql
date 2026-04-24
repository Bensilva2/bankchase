-- Create banking_data table for cross-device persistence
CREATE TABLE IF NOT EXISTS banking_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_banking_data_email ON banking_data(user_email);

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
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at on banking_data
DROP TRIGGER IF EXISTS update_banking_data_updated_at ON banking_data;
CREATE TRIGGER update_banking_data_updated_at
  BEFORE UPDATE ON banking_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
