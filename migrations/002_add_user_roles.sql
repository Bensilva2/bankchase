-- Ensure users table has role column with defaults
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'viewer';

-- Update existing users without roles to 'viewer'
UPDATE users SET role = 'viewer' WHERE role IS NULL;

-- Create an index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add comment to document the roles
COMMENT ON COLUMN users.role IS 'User role: admin (full access to admin panel), editor (can create/read/update), viewer (read-only access, regular users)';
