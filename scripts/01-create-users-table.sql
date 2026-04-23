-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  ssn TEXT,
  member_since DATE,
  tier TEXT DEFAULT 'Standard',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_username_idx ON public.users(username);

-- Insert test user
INSERT INTO public.users (
  email,
  username,
  password_hash,
  full_name,
  phone,
  address,
  date_of_birth,
  ssn,
  member_since,
  tier
) VALUES (
  'hungchun164@gmail.com',
  'CHUN HUNG',
  '$2b$10$0WaDWOqpU.t1s3z1DqU0COnc1UYLZf.BFP3b1k0R2V8qZ6c0FcRFe',
  'CHUN HUNG',
  '+1 (702) 886-4745',
  '34B Philadelphia, Pennsylvania PA, USA',
  '1961-08-24',
  '697-03-2642',
  '1988-08-01',
  'Chase Private Client'
) ON CONFLICT (email) DO NOTHING;
