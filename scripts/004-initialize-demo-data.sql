-- Initialize demo data for CHUN HUNG user
-- This script creates demo accounts, transactions, and user data

-- Insert demo user (CHUN HUNG)
INSERT INTO security.user_account (email, username, password_hash, first_name, last_name, status)
VALUES (
  'chun.hung@demo.example.com',
  'CHUN HUNG',
  -- bcrypt hash of "Chun200" - generate with: SELECT crypt('Chun200', gen_salt('bf', 10));
  '$2a$10$H8U8gC9pL6Q2F4e8x0R0X.eDxGqE7A0D0b5N5K9j8X8v8E0F6N5C2',
  'CHUN',
  'HUNG',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Get the user_id for CHUN HUNG
WITH chun_user AS (
  SELECT id FROM security.user_account WHERE email = 'chun.hung@demo.example.com'
)

-- Insert demo customer record
INSERT INTO finance.customer (user_id, first_name, last_name, email, status)
SELECT id, 'CHUN', 'HUNG', 'chun.hung@demo.example.com', 'active'
FROM chun_user
ON CONFLICT (email) DO NOTHING;

-- Insert demo checking account
INSERT INTO finance.account (customer_id, account_type, account_number, balance, currency, status)
SELECT c.id, 'Checking', '****5001', 5250.75, 'USD', 'active'
FROM finance.customer c
WHERE c.email = 'chun.hung@demo.example.com'
ON CONFLICT (account_number) DO NOTHING;

-- Insert demo savings account
INSERT INTO finance.account (customer_id, account_type, account_number, balance, currency, status)
SELECT c.id, 'Savings', '****5002', 12500.00, 'USD', 'active'
FROM finance.customer c
WHERE c.email = 'chun.hung@demo.example.com'
ON CONFLICT (account_number) DO NOTHING;

-- Insert demo money market account
INSERT INTO finance.account (customer_id, account_type, account_number, balance, currency, status)
SELECT c.id, 'Money Market', '****5003', 25000.50, 'USD', 'active'
FROM finance.customer c
WHERE c.email = 'chun.hung@demo.example.com'
ON CONFLICT (account_number) DO NOTHING;

-- Insert demo transactions for checking account
INSERT INTO finance.transaction (account_id, transaction_type, amount, description, status, created_at)
SELECT 
  a.id,
  'transfer',
  500.00,
  'Transfer to Savings',
  'completed',
  NOW() - INTERVAL '1 day'
FROM finance.account a
WHERE a.account_number = '****5001'
ON CONFLICT DO NOTHING;

INSERT INTO finance.transaction (account_id, transaction_type, amount, description, status, created_at)
SELECT 
  a.id,
  'payment',
  150.00,
  'Utilities Bill Payment',
  'completed',
  NOW() - INTERVAL '2 days'
FROM finance.account a
WHERE a.account_number = '****5001'
ON CONFLICT DO NOTHING;

INSERT INTO finance.transaction (account_id, transaction_type, amount, description, status, created_at)
SELECT 
  a.id,
  'deposit',
  1000.00,
  'Direct Deposit',
  'completed',
  NOW() - INTERVAL '3 days'
FROM finance.account a
WHERE a.account_number = '****5001'
ON CONFLICT DO NOTHING;

-- Insert demo employee record for HR module
INSERT INTO human_resource.employee (user_id, first_name, last_name, email, department_id, position, employment_status, hire_date)
SELECT u.id, 'CHUN', 'HUNG', 'chun.hung@demo.example.com', NULL, 'Senior Financial Analyst', 'active', CURRENT_DATE - INTERVAL '2 years'
FROM security.user_account u
WHERE u.email = 'chun.hung@demo.example.com'
ON CONFLICT (email) DO NOTHING;

-- Create session for demo user
INSERT INTO security.session (user_id, session_token, expires_at)
SELECT u.id, gen_random_uuid()::text, NOW() + INTERVAL '24 hours'
FROM security.user_account u
WHERE u.email = 'chun.hung@demo.example.com'
ON CONFLICT DO NOTHING;
