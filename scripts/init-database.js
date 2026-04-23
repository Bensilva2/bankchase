import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[v0] Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initDatabase() {
  try {
    console.log('[v0] Starting database initialization...');

    // Create users table
    const { error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError && usersError.code === 'PGRST103') {
      console.log('[v0] Creating users table...');
      const { error } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            username VARCHAR(255),
            password_hash VARCHAR(255),
            full_name VARCHAR(255),
            phone VARCHAR(20),
            address TEXT,
            ssn VARCHAR(11),
            date_of_birth DATE,
            member_since DATE,
            tier VARCHAR(50),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          
          ALTER TABLE users ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Users can read own data" ON users
            FOR SELECT USING (auth.uid() = id);
        `
      });
      
      if (error) {
        console.log('[v0] Note: users table might already exist or RLS policy failed (OK)');
      }
    }

    // Create accounts table
    console.log('[v0] Setting up accounts table...');
    const { error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .limit(1);

    if (accountsError && accountsError.code === 'PGRST103') {
      console.log('[v0] Creating accounts table...');
      await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS accounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id),
            account_number VARCHAR(20) UNIQUE,
            account_type VARCHAR(50),
            balance DECIMAL(15, 2) DEFAULT 0,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          
          ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
        `
      });
    }

    // Insert test user
    console.log('[v0] Checking for test user...');
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'hungchun164@gmail.com')
      .single();

    if (!existingUser) {
      console.log('[v0] Creating test user...');
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Chun2000', 10);

      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email: 'hungchun164@gmail.com',
            username: 'CHUN HUNG',
            password_hash: hashedPassword,
            full_name: 'CHUN HUNG',
            phone: '+1 (702) 886-4745',
            address: '34B Philadelphia, Pennsylvania PA, USA',
            ssn: '697-03-2642',
            date_of_birth: '1961-08-24',
            member_since: '1988-08-01',
            tier: 'Chase Private Client'
          }
        ]);

      if (insertError) {
        console.error('[v0] Failed to insert test user:', insertError);
      } else {
        console.log('[v0] Test user created successfully');
      }
    } else {
      console.log('[v0] Test user already exists');
    }

    console.log('[v0] Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('[v0] Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
