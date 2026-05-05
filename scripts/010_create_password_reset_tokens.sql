-- Password Reset Tokens Table
-- Stores temporary tokens for password reset functionality
-- Tokens expire after 1 hour

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  token_exp INTEGER NOT NULL, -- Unix timestamp
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_user_reset UNIQUE(user_id)
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token 
  ON password_reset_tokens(token);

-- Index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_exp 
  ON password_reset_tokens(token_exp);

-- Comment for documentation
COMMENT ON TABLE password_reset_tokens IS 
  'Temporary password reset tokens with 1-hour expiration';
