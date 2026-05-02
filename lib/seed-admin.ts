import { createClient } from '@supabase/supabase-js'
import { hashPassword } from './auth'

export async function seedAdminUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }

  const supabase = createClient(url, key)

  try {
    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin@bankchase.com')
      .single()

    if (existingAdmin) {
      return { success: true, message: 'Admin user already exists' }
    }

    // Hash the admin password
    const passwordHash = await hashPassword('Admin@123456')

    // Create admin user
    const { data: adminUser, error } = await supabase
      .from('users')
      .insert([
        {
          username: 'admin',
          email: 'admin@bankchase.com',
          password_hash: passwordHash,
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin',
          phone: '1-800-ADMIN-1',
          date_of_birth: '1990-01-01',
          address: '123 Admin Street',
          city: 'Admin City',
          state: 'AC',
          zip_code: '12345',
        },
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

    // Create default checking account for admin
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert([
        {
          user_id: adminUser.id,
          account_type: 'Checking',
          account_number: generateAccountNumber(),
          routing_number: '021000021',
          balance: 10000.0, // Admin gets $10k starting balance
          bank_name: 'Chase Bank',
          is_external: false,
        },
      ])
      .select()
      .single()

    if (accountError) {
      throw accountError
    }

    return {
      success: true,
      message: 'Admin user created successfully',
      admin: {
        email: adminUser.email,
        password: 'Admin@123456',
        role: adminUser.role,
      },
    }
  } catch (error) {
    console.error('Error seeding admin user:', error)
    throw error
  }
}

function generateAccountNumber(): string {
  return Math.random().toString().slice(2, 12).padEnd(10, '0')
}
