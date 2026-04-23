#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedTestUser() {
  try {
    console.log('🔐 Seeding test user into database...')

    // Hash the password
    const hashedPassword = await bcrypt.hash('Chun2000', 10)

    // Insert test user
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          email: 'CHUN HUNG',
          password_hash: hashedPassword,
          name: 'CHUN HUNG',
          phone: '+1 (702) 886-4745',
          address: '34B Philadelphia, Pennsylvania PA, USA',
          dob: '1961-08-24',
          ssn: '697-03-2642',
          member_since: '1988-08-01',
          tier: 'Chase Private Client',
          two_factor_enabled: false,
          created_at: new Date().toISOString(),
          last_login: null,
        },
        { onConflict: 'email' }
      )
      .select()

    if (error) {
      console.error('❌ Error seeding user:', error)
      process.exit(1)
    }

    console.log('✅ Test user seeded successfully!')
    console.log('📧 Email/Username: CHUN HUNG')
    console.log('🔑 Password: Chun2000')
    console.log('User ID:', data[0]?.id)
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  }
}

seedTestUser()
