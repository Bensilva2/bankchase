-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'viewer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_date TIMESTAMP DEFAULT NOW();

-- Create roles enum type
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role, action, resource)
);

-- Insert default permissions for each role
-- Admin: Full access
INSERT INTO permissions (role, action, resource) VALUES
  ('admin', 'create', 'accounts'),
  ('admin', 'read', 'accounts'),
  ('admin', 'update', 'accounts'),
  ('admin', 'delete', 'accounts'),
  ('admin', 'create', 'transactions'),
  ('admin', 'read', 'transactions'),
  ('admin', 'update', 'transactions'),
  ('admin', 'delete', 'transactions'),
  ('admin', 'read', 'users'),
  ('admin', 'update', 'users'),
  ('admin', 'access', 'admin_dashboard')
ON CONFLICT DO NOTHING;

-- Editor: Can create and read, limited update
INSERT INTO permissions (role, action, resource) VALUES
  ('editor', 'create', 'accounts'),
  ('editor', 'read', 'accounts'),
  ('editor', 'update', 'accounts'),
  ('editor', 'create', 'transactions'),
  ('editor', 'read', 'transactions'),
  ('editor', 'read', 'users')
ON CONFLICT DO NOTHING;

-- Viewer: Read-only access
INSERT INTO permissions (role, action, resource) VALUES
  ('viewer', 'read', 'accounts'),
  ('viewer', 'read', 'transactions'),
  ('viewer', 'read', 'users')
ON CONFLICT DO NOTHING;

-- Update existing users table to set default role as 'viewer'
UPDATE users SET role = 'viewer' WHERE role IS NULL;
