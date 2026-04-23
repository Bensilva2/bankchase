#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('[v0] Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Missing')
console.log('[v0] Service Role Key:', supabaseKey ? '✓ Set' : '✗ Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('[v0] ERROR: Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  try {
    console.log('[v0] Creating users table...')

    // Create users table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
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

        CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
        CREATE INDEX IF NOT EXISTS users_username_idx ON public.users(username);
      `
    })

    if (createError) {
      // This might fail if the function doesn't exist, try direct approach
      console.log('[v0] Using direct table insertion approach...')
      
      // Check if table exists by trying to insert
      const hashedPassword = await bcrypt.hash('Chun2000', 10)
      
      const { data, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email: 'hungchun164@gmail.com',
            username: 'CHUN HUNG',
            password_hash: hashedPassword,
            full_name: 'CHUN HUNG',
            phone: '+1 (702) 886-4745',
            address: '34B Philadelphia, Pennsylvania PA, USA',
            date_of_birth: '1961-08-24',
            ssn: '697-03-2642',
            member_since: '1988-08-01',
            tier: 'Chase Private Client'
          }
        ])
        .select()

      if (insertError) {
        console.error('[v0] ERROR inserting user:', insertError.message)
        console.log('[v0] Note: Table might not exist yet. Please create it manually in Supabase dashboard.')
        process.exit(1)
      }

      console.log('[v0] ✓ Test user created successfully!')
      console.log('[v0] Email: hungchun164@gmail.com')
      console.log('[v0] Username: CHUN HUNG')
      console.log('[v0] Password: Chun2000')
      return
    }

    console.log('[v0] ✓ Users table created successfully!')

    // Insert test user
    const hashedPassword = await bcrypt.hash('Chun2000', 10)

    const { data, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          email: 'hungchun164@gmail.com',
          username: 'CHUN HUNG',
          password_hash: hashedPassword,
          full_name: 'CHUN HUNG',
          phone: '+1 (702) 886-4745',
          address: '34B Philadelphia, Pennsylvania PA, USA',
          date_of_birth: '1961-08-24',
          ssn: '697-03-2642',
          member_since: '1988-08-01',
          tier: 'Chase Private Client'
        }
      ])
      .select()

    if (insertError) {
      console.error('[v0] ERROR inserting user:', insertError.message)
      process.exit(1)
    }

    console.log('[v0] ✓ Test user inserted successfully!')
    console.log('[v0] Email: hungchun164@gmail.com')
    console.log('[v0] Username: CHUN HUNG')
    console.log('[v0] Password: Chun2000')

  } catch (error) {
    console.error('[v0] ERROR:', error.message)
    process.exit(1)
  }
}

await setupDatabase()
